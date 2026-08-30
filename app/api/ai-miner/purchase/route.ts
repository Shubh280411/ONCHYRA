import { NextRequest, NextResponse } from 'next/server';
import { get, set } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

const AI_MINER_PLANS = [
  { id: 'ai_basic', name: 'Basic', price: 5, hourlyReward: 0.01, duration: 30, description: '30 days, $0.01/hour' },
  { id: 'ai_pro', name: 'Pro', price: 15, hourlyReward: 0.03, duration: 30, description: '30 days, $0.03/hour' },
  { id: 'ai_elite', name: 'Elite', price: 50, hourlyReward: 0.10, duration: 60, description: '60 days, $0.10/hour' },
  { id: 'ai_titan', name: 'Titan', price: 100, hourlyReward: 0.20, duration: 90, description: '90 days, $0.20/hour' },
];

export async function POST(request: NextRequest) {
  try {
    const { uid, planId } = await request.json();

    if (!uid || !planId) {
      return NextResponse.json({ error: 'uid and planId required' }, { status: 400 });
    }

    const plan = AI_MINER_PLANS.find(p => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const user = await get('users', uid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const walletBalance = Number(user.wallet_balance) || 0;
    if (walletBalance < plan.price) {
      return NextResponse.json({ error: 'Insufficient wallet balance', walletBalance, required: plan.price }, { status: 400 });
    }

    const now = Date.now();
    const expiresAt = now + (plan.duration * 24 * 60 * 60 * 1000);

    await set('users', uid, {
      wallet_balance: walletBalance - plan.price,
      ai_miner_active: true,
      ai_miner_plan: planId,
      ai_miner_started_at: now,
      ai_miner_expires_at: expiresAt,
      ai_miner_last_claim: 0,
      ai_miner_total_claimed: 0,
    });

    const purchaseId = `${uid}_${planId}_${now}`;
    await set('ai_miner_purchases', purchaseId, {
      uid,
      plan_id: planId,
      plan_name: plan.name,
      price: plan.price,
      hourly_reward: plan.hourlyReward,
      duration: plan.duration,
      started_at: now,
      expires_at: expiresAt,
      created_at: now,
    }, 'id');

    await createNotification(uid, 'AI Miner Activated', `Your ${plan.name} AI Miner plan is now active. Earning $${plan.hourlyReward}/hour`, 'ai_miner');

    return NextResponse.json({ success: true, plan, expiresAt });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
