import { NextRequest, NextResponse } from 'next/server';
import { findWhere, update, set, get } from '@/lib/db';

const AI_MINER_PLANS: Record<string, { hourlyReward: number; name: string }> = {
  ai_basic: { hourlyReward: 0.01, name: 'Basic' },
  ai_pro: { hourlyReward: 0.03, name: 'Pro' },
  ai_elite: { hourlyReward: 0.10, name: 'Elite' },
  ai_titan: { hourlyReward: 0.20, name: 'Titan' },
};

export async function GET(_request: NextRequest) {
  try {
    const activeUsers = await findWhere('users', { ai_miner_active: true });

    const stats = { processed: 0, credited: 0, expired: 0, errors: 0 };
    const now = Date.now();

    for (const user of activeUsers) {
      stats.processed++;
      const uid = user.uid as string;

      try {
        const expiresAt = Number(user.ai_miner_expires_at) || 0;
        if (expiresAt > 0 && now > expiresAt) {
          await update('users', uid, { ai_miner_active: false });
          stats.expired++;
          continue;
        }

        const lastClaim = Number(user.ai_miner_last_claim) || 0;
        if (lastClaim > 0) {
          const hoursSince = (now - lastClaim) / (1000 * 60 * 60);
          if (hoursSince < 1) continue;
        }

        const planId = user.ai_miner_plan as string;
        const plan = AI_MINER_PLANS[planId];
        if (!plan) {
          await update('users', uid, { ai_miner_active: false });
          stats.expired++;
          continue;
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

        stats.credited++;
      } catch {
        stats.errors++;
        const planId = user.ai_miner_plan as string || 'unknown';
        const historyId = `${uid}_${now}_err`;
        await set('ai_miner_history', historyId, {
          uid,
          plan_id: planId,
          amount: 0,
          status: 'failed',
          created_at: now,
        }, 'id').catch(() => {});
      }
    }

    return NextResponse.json({ success: true, stats });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
