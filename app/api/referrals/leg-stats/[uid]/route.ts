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

    const refCode = user.referral_code as string;
    if (!refCode) {
      return NextResponse.json({ totalDirects: 0, activeDirects: 0, legABiz: 0, legBBiz: 0, teamBiz: 0 });
    }

    const l1Rows = await findWhere('users', { referred_by: refCode }).catch(() => []);
    const totalDirects = l1Rows.length;
    const activeDirects = l1Rows.filter((u) => u.active_package).length;

    const legBiz = l1Rows
      .map((u) => Number(u.total_package_spend) || 0)
      .sort((a, b) => b - a);
    const legABiz = legBiz.length > 0 ? legBiz[0] : 0;
    const legBBiz = legBiz.slice(1).reduce((s, x) => s + Number(x), 0);
    const teamBiz = legBiz.reduce((s, x) => s + Number(x), 0);

    return NextResponse.json({
      totalDirects,
      activeDirects,
      legABiz: Number(legABiz),
      legBBiz: Number(legBBiz),
      teamBiz: Number(teamBiz),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
