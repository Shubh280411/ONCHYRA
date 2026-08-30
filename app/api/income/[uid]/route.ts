import { NextRequest, NextResponse } from 'next/server';
import { findWhere } from '@/lib/db';
import { cc } from '@/lib/utils';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const [commissions, achievements, rewards, claims, onxDistributions] = await Promise.all([
      findWhere('commissions', { uid }, 'created_at', 200),
      findWhere('achievement_bonuses', { uid }, 'created_at', 200),
      findWhere('leadership_rewards', { uid }, 'created_at', 200),
      findWhere('claims', { user_id: uid }, 'created_at', 200).catch(() => []),
      findWhere('onx_distributions', { uid }, 'created_at', 100).catch(() => []),
    ]);
    return NextResponse.json({
      commissions: commissions.map(cc),
      achievements: achievements.map(cc),
      rewards: rewards.map(cc),
      claims: claims.map(cc),
      onxDistributions: onxDistributions.map(cc),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
