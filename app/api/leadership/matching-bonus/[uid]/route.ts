import { NextRequest, NextResponse } from 'next/server';
import { get, findWhere } from '@/lib/db';

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

    const directRows = user.referral_code
      ? await findWhere('users', { referred_by: user.referral_code as string })
      : [];
    let total = 0;
    for (const u of directRows) {
      if ((u.leadership_reward_payouts as number) > 0 && (u.leadership_reward_day as number) > 0) {
        const earned = (u.leadership_reward_payouts as number) * (u.leadership_reward_day as number);
        total += earned * 0.1;
      }
    }
    return NextResponse.json({ success: true, matchingBonus: Math.round(total * 100) / 100 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
