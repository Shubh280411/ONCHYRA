import { NextRequest, NextResponse } from 'next/server';
import { query, findWhere, increment, update } from '@/lib/db';
import { getPrice } from '@/lib/priceFetcher';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { txHash, address, amount, network } = body;

    if (!txHash || !address || !amount || !network) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const wallets = await findWhere('deposit_wallets', { address: address.toLowerCase() });
    if (!wallets.length) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }
    const wallet = wallets[0];

    const existing = await findWhere('deposits', { tx_hash: txHash });
    if (existing.length) {
      return NextResponse.json({ error: 'Duplicate transaction' }, { status: 400 });
    }

    const rawAmount = parseFloat(amount);
    let usdAmount = rawAmount;
    let polPrice = 0;
    if (network === 'Polygon') {
      polPrice = await getPrice();
      usdAmount = rawAmount * (polPrice || 0);
    }

    await query(
      `INSERT INTO deposits (id, uid, address, network, amount, tx_hash, status, pol_amount, pol_price, confirmed_at, created_at)
       VALUES ('dep_' || $1 || '_' || $2, $1, $3, $4, $5, $6, 'completed', $7, $8, $9, $9)`,
      [wallet.uid, txHash.slice(0, 8), address, network, usdAmount, txHash,
       network === 'Polygon' ? rawAmount : 0, polPrice, Date.now()]
    );

    await increment('users', wallet.uid as string, 'wallet_balance', usdAmount);
    await increment('users', wallet.uid as string, 'total_deposits', usdAmount);

    await update('deposit_wallets', wallet.id as string, {
      used: true, used_at: Date.now(), tx_hash: txHash
    }, 'id');

    return NextResponse.json({ success: true, amount: usdAmount, network });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
