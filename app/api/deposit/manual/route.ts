import { NextRequest, NextResponse } from 'next/server';
import { get, set, increment, findWhere, update } from '@/lib/db';

async function requireAdmin(request: NextRequest) {
  const uid = request.headers.get('x-auth-uid');
  if (!uid) return { error: 'No uid', status: 401 as const };
  const admin = await get('admins', uid);
  if (!admin) return { error: 'Not admin', status: 403 as const };
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const body = await request.json();
    const { uid, address, amount, network, token, polAmount, polPrice, usdAmount, fixDepositId } = body;

    if (!uid || !address || !network) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const ts = Date.now();
    const polAmt = Number(polAmount) || 0;
    const usdAmt = Number(usdAmount) || Number(amount) || 0;
    const pPrice = Number(polPrice) || 0;
    const tok = token || (network === 'Polygon' ? 'POL' : 'USDT');

    if (fixDepositId) {
      const oldRows = await findWhere('deposits', { id: fixDepositId }, null, 1);
      if (!oldRows.length) {
        return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });
      }
      const oldAmt = parseFloat(String(oldRows[0].amount)) || 0;
      await update('deposits', fixDepositId, { amount: usdAmt.toFixed(2), pol_price: pPrice }, 'id');
      const diff = usdAmt - oldAmt;
      if (diff !== 0) {
        const user = await get('users', uid);
        if (user) {
          await update('users', uid, { wallet_balance: (Number(user.wallet_balance) || 0) + diff });
        }
      }
      console.log(`[MANUAL FIX] ${fixDepositId}: $${oldAmt} → $${usdAmt}, balance adj: ${diff.toFixed(2)}`);
      return NextResponse.json({ success: true, fixed: fixDepositId, oldAmount: oldAmt, newAmount: usdAmt, balanceAdjustment: diff });
    }

    const depId = 'dep_manual_' + uid.slice(0, 8) + '_' + ts;
    const tx = 'manual_' + ts;
    await set('deposits', depId, {
      uid,
      address,
      network,
      amount: usdAmt.toFixed(2),
      tx_hash: tx,
      status: 'completed',
      token: tok,
      pol_amount: polAmt,
      pol_price: pPrice,
      detected_at: ts,
      created_at: ts,
    });

    const user = await get('users', uid);
    if (user) {
      await update('users', uid, {
        wallet_balance: (Number(user.wallet_balance) || 0) + usdAmt,
      });
    }

    console.log(`[MANUAL DEPOSIT] ${polAmt || usdAmt} ${tok} for ${uid}`);
    return NextResponse.json({ success: true, depositId: depId });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
