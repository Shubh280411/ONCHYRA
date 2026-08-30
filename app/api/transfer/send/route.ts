import { NextRequest, NextResponse } from 'next/server';
import { get, increment, findWhere, set } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { fromUid, referralCode, amount, note } = await request.json();
    if (!fromUid || !referralCode || !amount) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    if (amount < 1) {
      return NextResponse.json({ error: 'Minimum transfer is 1 ONC' }, { status: 400 });
    }
    if (amount > 500) {
      return NextResponse.json({ error: 'Maximum transfer is 500 ONC' }, { status: 400 });
    }

    const sender = await get('users', fromUid);
    if (!sender) {
      return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
    }

    if ((sender.balance || 0) < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const receivers = await findWhere('users', { referral_code: (referralCode as string).toUpperCase() });
    if (!receivers.length) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });
    }
    const receiver = receivers[0];

    if (receiver.uid === fromUid) {
      return NextResponse.json({ error: 'Cannot send to yourself' }, { status: 400 });
    }

    const now = Date.now();
    const h24 = 24 * 60 * 60 * 1000;
    let recentTransfers: Record<string, unknown>[] = [];
    try {
      const allTransfers = await findWhere('p2p_transfers', { from_uid: fromUid });
      recentTransfers = allTransfers.filter((t: Record<string, unknown>) => Number(t.created_at) > now - h24);
    } catch { /* */ }

    if (recentTransfers.length >= 3) {
      return NextResponse.json({ error: 'Daily transfer limit reached (3/24h)' }, { status: 400 });
    }

    const burn = Math.round((amount as number) * 0.1 * 100) / 100;
    const net = Math.round(((amount as number) - burn) * 100) / 100;

    await increment('users', fromUid, 'balance', -amount);
    await increment('users', receiver.uid as string, 'balance', net);

    const trfId = 'trf_' + fromUid + '_' + Date.now();
    await set('p2p_transfers', trfId, {
      from_uid: fromUid,
      to_uid: receiver.uid,
      from_code: sender.referral_code || '?',
      to_code: (referralCode as string).toUpperCase(),
      from_name: sender.name || '?',
      to_name: receiver.name || '?',
      gross_amount: amount,
      burn,
      net_amount: net,
      note: note || '',
      status: 'completed',
      created_at: now,
    }, 'id');

    return NextResponse.json({ success: true, amount, burn, received: net });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
