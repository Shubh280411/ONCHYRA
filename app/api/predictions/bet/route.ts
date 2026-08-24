import { NextRequest, NextResponse } from 'next/server';
import { query, get } from '@/lib/db';

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

    const walletBalance = Number(user.walletbalance) || 0;
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

    await query(
      `UPDATE users SET walletbalance = walletbalance - $1 WHERE uid = $2`,
      [betAmount, user_id]
    );

    await query(
      `INSERT INTO prediction_bets (id, user_id, round_id, amount, prediction, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [crypto.randomUUID(), user_id, round_id, betAmount, prediction, Date.now()]
    );

    const poolField = prediction === 'up' ? 'up_pool' : 'down_pool';
    await query(
      `UPDATE predictions SET total_bets = COALESCE(total_bets, 0) + 1,
       total_pool = COALESCE(total_pool, 0) + $1,
       ${poolField} = COALESCE("${poolField}", 0) + $1
       WHERE id = $2`,
      [betAmount, round_id]
    );

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
