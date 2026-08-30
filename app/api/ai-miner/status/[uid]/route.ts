import { NextRequest, NextResponse } from 'next/server';
import { get } from '@/lib/db';

const AI_MINER_PLANS: Record<string, { hourlyReward: number; name: string; price: number; duration: number }> = {
  ai_basic: { hourlyReward: 0.01, name: 'Basic', price: 5, duration: 30 },
  ai_pro: { hourlyReward: 0.03, name: 'Pro', price: 15, duration: 30 },
  ai_elite: { hourlyReward: 0.10, name: 'Elite', price: 50, duration: 60 },
  ai_titan: { hourlyReward: 0.20, name: 'Titan', price: 100, duration: 90 },
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const user = await get('users', uid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = Date.now();
    const active = !!user.ai_miner_active;
    const expiresAt = Number(user.ai_miner_expires_at) || 0;
    const startedAt = Number(user.ai_miner_started_at) || 0;
    const lastClaim = Number(user.ai_miner_last_claim) || 0;
    const totalClaimed = Number(user.ai_miner_total_claimed) || 0;
    const planId = user.ai_miner_plan as string;
    const plan = planId ? AI_MINER_PLANS[planId] || null : null;

    const hourlyReward = plan ? plan.hourlyReward : 0;
    const remainingDays = active && expiresAt > now
      ? Math.max(0, Math.floor((expiresAt - now) / (24 * 60 * 60 * 1000)))
      : 0;
    const hoursElapsed = startedAt > 0
      ? Math.floor((now - startedAt) / (1000 * 60 * 60))
      : 0;
    const nextClaimAt = lastClaim > 0 ? lastClaim + 3600000 : (startedAt > 0 ? startedAt : now);

    return NextResponse.json({
      active,
      plan: plan ? { ...plan, id: planId } : null,
      hourlyReward,
      totalClaimed,
      lastClaim,
      nextClaimAt,
      expiresAt,
      remainingDays,
      hoursElapsed,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
