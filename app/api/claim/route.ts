import { NextRequest, NextResponse } from 'next/server';
import { get, set, update } from '@/lib/db';

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
    const lastClaim = Number(user.last_claim || user.lastclaim) || 0;
    const hoursSince = (now - lastClaim) / (1000 * 60 * 60);

    if (lastClaim > 0 && hoursSince < 24) {
      const hoursLeft = 24 - hoursSince;
      const h = Math.floor(hoursLeft);
      const m = Math.floor((hoursLeft - h) * 60);
      return NextResponse.json({ error: `Claim available in ${h}h ${m}m`, hoursLeft: hoursLeft.toFixed(1) }, { status: 400 });
    }

    const packageBoost = Number(user.package_boost || user.packageboost) || 1;
    const claimAmount = parseFloat((0.05 * packageBoost).toFixed(4));
    const previousBalance = Number(user.balance) || 0;
    const previousStreak = Number(user.streak) || 0;
    const newBalance = previousBalance + claimAmount;
    const newStreak = previousStreak + 1;

    await update('users', uid, {
      balance: newBalance,
      total_claimed: (Number(user.total_claimed || user.totalclaimed) || 0) + claimAmount,
      last_claim: now,
      streak: newStreak,
    });

    // Save claim history for analytics
    try {
      const claimId = crypto.randomUUID();
      await set('claims', claimId, {
        user_id: uid,
        amount: claimAmount,
        balance_after: newBalance,
        streak: newStreak,
        created_at: now,
      });
    } catch { /* */ }

    return NextResponse.json({ success: true, claimed: claimAmount, balance: newBalance, streak: newStreak });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
