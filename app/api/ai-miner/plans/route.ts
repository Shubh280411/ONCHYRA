import { NextResponse } from 'next/server';

const AI_MINER_PLANS = [
  { id: 'ai_basic', name: 'Basic', price: 5, hourlyReward: 0.01, duration: 30, description: '30 days, $0.01/hour' },
  { id: 'ai_pro', name: 'Pro', price: 15, hourlyReward: 0.03, duration: 30, description: '30 days, $0.03/hour' },
  { id: 'ai_elite', name: 'Elite', price: 50, hourlyReward: 0.10, duration: 60, description: '60 days, $0.10/hour' },
  { id: 'ai_titan', name: 'Titan', price: 100, hourlyReward: 0.20, duration: 90, description: '90 days, $0.20/hour' },
];

export async function GET() {
  try {
    return NextResponse.json({ plans: AI_MINER_PLANS });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
