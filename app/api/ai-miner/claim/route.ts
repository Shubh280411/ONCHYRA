import { NextRequest, NextResponse } from 'next/server';
import { get, update, set, increment } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

const AI_MINER_PLANS: Record<string, { hourlyReward: number; name: string }> = {
  ai_basic: { hourlyReward: 0.01, name: 'Basic' },
  ai_pro: { hourlyReward: 0.03, name: 'Pro' },
  ai_elite: { hourlyReward: 0.10, name: 'Elite' },
  ai_titan: { hourlyReward: 0.20, name: 'Titan' },
};

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

    if (!user.ai_miner_active) {
      return NextResponse.json({ error: 'AI Miner not active' }, { status: 400 });
    }

    const now = Date.now();
    const expiresAt = Number(user.ai_miner_expires_at) || 0;

    if (expiresAt > 0 && now > expiresAt) {
      await update('users', uid, { ai_miner_active: false });
      return NextResponse.json({ error: 'AI Miner subscription expired', expired: true }, { status: 400 });
    }

    const lastClaim = Number(user.ai_miner_last_claim) || 0;
    if (lastClaim > 0) {
      const hoursSince = (now - lastClaim) / (1000 * 60 * 60);
      if (hoursSince < 1) {
        const minutesLeft = Math.ceil((1 - hoursSince) * 60);
        return NextResponse.json({ error: `Claim available in ${minutesLeft} minutes`, nextClaimAt: lastClaim + 3600000 }, { status: 400 });
      }
    }

    const planId = user.ai_miner_plan as string;
    const plan = AI_MINER_PLANS[planId];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const amount = plan.hourlyReward;
    const previousBalance = Number(user.balance) || 0;
    const newBalance = previousBalance + amount;
    const totalClaimed = (Number(user.ai_miner_total_claimed) || 0) + amount;

    await update('users', uid, {
      balance: newBalance,
      ai_miner_last_claim: now,
      ai_miner_total_claimed: totalClaimed,
    });

    const historyId = `${uid}_${now}`;
    await set('ai_miner_history', historyId, {
      uid,
      plan_id: planId,
      amount,
      status: 'success',
      created_at: now,
    }, 'id');

    await createNotification(uid, 'AI Miner Claim', `AI Miner reward of $${amount.toFixed(4)} credited`, 'ai_miner');

    return NextResponse.json({
      success: true,
      amount,
      totalClaimed,
      nextClaimAt: now + 3600000,
      expiresAt,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    const { uid } = await request.json().catch(() => ({})) as { uid?: string };
    if (uid) {
      const now = Date.now();
      const historyId = `${uid}_${now}`;
      const user = await get('users', uid);
      const planId = user?.ai_miner_plan as string || 'unknown';
      await set('ai_miner_history', historyId, {
        uid,
        plan_id: planId,
        amount: 0,
        status: 'failed',
        created_at: now,
      }, 'id').catch(() => {});
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
