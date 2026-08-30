import { NextRequest, NextResponse } from 'next/server';
import { get, set, update } from '@/lib/db';
import { getOtpEntry, deleteOtpEntry } from '@/lib/otpStore';
import { createNotification } from '@/lib/notifications';

const MIN_WITHDRAW = 25;

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];

async function sendOnxTokens(toAddress: string, amount: number): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const ethers = await import('ethers');
    const seed = process.env.ONX_WITHDRAWAL_SEED;
    const tokenAddress = process.env.ONX_TOKEN_ADDRESS;
    const rpcUrl = process.env.POLYGON_RPC || 'https://polygon-bor.publicnode.com';

    if (!seed || !tokenAddress) {
      return { success: false, error: 'ONX withdrawal not configured' };
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = ethers.Wallet.fromPhrase(seed).connect(provider);
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);

    const decimals = await token.decimals();
    const sendAmount = ethers.parseUnits(amount.toString(), decimals);

    // Check balance
    const balance = await token.balanceOf(wallet.address);
    if (balance < sendAmount) {
      return { success: false, error: 'Insufficient ONX in withdrawal wallet' };
    }

    // Send tokens
    const tx = await token.transfer(toAddress, sendAmount);
    const receipt = await tx.wait();

    return { success: true, txHash: receipt.hash };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[ONX Withdraw] Transfer failed:', msg);
    return { success: false, error: msg };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { uid, address, amount, otp, email } = await request.json();

    if (!uid || !address || !amount || !otp || !email) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < MIN_WITHDRAW) {
      return NextResponse.json({ error: `Minimum withdrawal is ${MIN_WITHDRAW} ONX` }, { status: 400 });
    }

    if (!address.startsWith('0x') || address.length !== 42) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    // Verify OTP
    const key = email.toLowerCase();
    const entry = getOtpEntry(key);
    let otpValid = false;

    if (entry) {
      if (entry.verified) {
        otpValid = true;
      } else if (Date.now() <= entry.expiresAt && entry.otp === otp) {
        otpValid = true;
        entry.verified = true;
      }
    }

    if (!otpValid) {
      try {
        const row = await get('otp_store', key, 'email');
        if (row && row.otp === otp && !row.verified && Date.now() <= (row.expires_at as number)) {
          otpValid = true;
          update('otp_store', key, { verified: true }, 'email').catch(() => {});
        }
      } catch { /* fall through */ }
    }

    if (!otpValid) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // Check balance
    const user = await get('users', uid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const balance = Number(user.onx_balance) || 0;
    if (balance < numAmount) {
      return NextResponse.json({ error: 'Insufficient ONX balance' }, { status: 400 });
    }

    // Deduct balance first
    const newBalance = balance - numAmount;
    await update('users', uid, { onx_balance: newBalance });

    // Create withdrawal record
    const withdrawalId = `onxwd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await set('onx_withdrawals', withdrawalId, {
      id: withdrawalId,
      uid,
      address,
      amount: numAmount,
      status: 'processing',
      tx_hash: null,
      created_at: Date.now(),
      completed_at: null,
    }, 'id');

    // Send ONX tokens automatically
    const result = await sendOnxTokens(address, numAmount);

    if (result.success) {
      await update('onx_withdrawals', withdrawalId, {
        status: 'completed',
        tx_hash: result.txHash || null,
        completed_at: Date.now(),
      });

      createNotification(uid, 'ONX Withdrawal Completed', `${numAmount} ONX sent to ${address.slice(0, 6)}...${address.slice(-4)}`, 'success').catch(() => {});

      return NextResponse.json({
        success: true,
        message: `${numAmount} ONX withdrawn successfully`,
        newBalance,
        txHash: result.txHash,
        withdrawalId,
      });
    } else {
      // Refund balance on failure
      await update('users', uid, { onx_balance: balance });
      await update('onx_withdrawals', withdrawalId, { status: 'failed' });

      createNotification(uid, 'ONX Withdrawal Failed', `Withdrawal of ${numAmount} ONX failed: ${result.error}`, 'error').catch(() => {});

      return NextResponse.json({ error: result.error || 'Transfer failed' }, { status: 500 });
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[ONX Withdraw]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const uid = request.nextUrl.searchParams.get('uid');
    if (!uid) {
      return NextResponse.json({ error: 'uid required' }, { status: 400 });
    }

    const { all } = await import('@/lib/db');
    const withdrawals = await all('onx_withdrawals');
    const userWithdrawals = withdrawals
      .filter((w: Record<string, unknown>) => w.uid === uid)
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (b.created_at as number) - (a.created_at as number))
      .slice(0, 20);

    return NextResponse.json({ withdrawals: userWithdrawals });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
