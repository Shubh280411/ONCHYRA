import { NextRequest, NextResponse } from 'next/server';
import { get, increment, set, update } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { user_id, round_id, amount, prediction } = await request.json();

    if (!user_id || !round_id || !amount || !prediction) {
      return NextResponse.json({ error: 'user_id, round_id, amount, and prediction required' }, { status: 400 });
    }

    if (prediction !== 'up' && prediction !== 'down') {
      return NextResponse.json({ error: 'prediction must be "up" or "down"' }, { status: 400 });
    }

    const user = await get('users', user_id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const walletBalance = Number(user.wallet_balance || user.walletbalance) || 0;
    const betAmount = Number(amount);

    if (betAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    }

    if (walletBalance < betAmount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const round = await get('predictions', round_id, 'id');
    if (!round || round.status !== 'active') {
      return NextResponse.json({ error: 'Round not found or inactive' }, { status: 404 });
    }

    await increment('users', user_id, 'wallet_balance', -betAmount);

    const betId = crypto.randomUUID();
    await set('prediction_bets', betId, {
      user_id,
      round_id,
      amount: betAmount,
      prediction,
      created_at: Date.now(),
    });

    const poolField = prediction === 'up' ? 'up_pool' : 'down_pool';
    await update('predictions', round_id, {
      total_bets: (Number(round.total_bets) || 0) + 1,
      total_pool: (Number(round.total_pool) || 0) + betAmount,
      [poolField]: (Number(round[poolField]) || 0) + betAmount,
    }, 'id');

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
