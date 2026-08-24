import { NextRequest, NextResponse } from 'next/server';
import { query, get } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: 'uid required' }, { status: 400 });
    }

    const user = await get('users', uid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = Date.now();
    const lastClaim = Number(user.lastclaim) || 0;
    const hoursSince = (now - lastClaim) / (1000 * 60 * 60);

    if (hoursSince < 24) {
      return NextResponse.json({ error: 'Must wait 24h between claims', hoursLeft: (24 - hoursSince).toFixed(1) }, { status: 400 });
    }

    const packageBoost = Number(user.packageboost) || 1;
    const claimAmount = 1 * packageBoost;
    const previousBalance = Number(user.balance) || 0;
    const previousStreak = Number(user.streak) || 0;
    const newBalance = previousBalance + claimAmount;
    const newStreak = previousStreak + 1;

    await query(
      `UPDATE users SET balance = $1, totalclaimed = COALESCE(totalclaimed, 0) + $2, lastclaim = $3, streak = $4 WHERE uid = $5`,
      [newBalance, claimAmount, now, newStreak, uid]
    );

    await query(
      `INSERT INTO claims (id, user_id, previous_balance, claimed_balance, claimed_amount, previous_streak, claimed_streak, time_since_last_claim, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'completed', $9)`,
      [crypto.randomUUID(), uid, previousBalance, newBalance, claimAmount, previousStreak, newStreak, Math.round(hoursSince * 60 * 60 * 1000), now]
    );

    return NextResponse.json({ success: true, claimed: claimAmount, balance: newBalance, streak: newStreak });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
