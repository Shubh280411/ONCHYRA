import { NextRequest, NextResponse } from 'next/server';
import { get, findWhere, findWhereIn, query } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const u = await get('users', uid);
    if (!u) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const refCode = u.referral_code as string;
    let refLevel1 = 0;
    let refLevel2 = 0;
    let refLevel3 = 0;
    let totalCommissions = 0;

    if (refCode) {
      const l1Rows = await findWhere('users', { referred_by: refCode });
      refLevel1 = l1Rows.length;

      const l1Codes = l1Rows.map((r) => r.referral_code).filter(Boolean);
      if (l1Codes.length) {
        const l2Rows = await findWhereIn('users', 'referred_by', l1Codes);
        refLevel2 = l2Rows.length;
        const l2Codes = l2Rows.map((r) => r.referral_code).filter(Boolean);
        if (l2Codes.length) {
          const l3Rows = await findWhereIn('users', 'referred_by', l2Codes);
          refLevel3 = l3Rows.length;
        }
      }

      const commRes = await query(
        'SELECT COALESCE(SUM(amount),0) AS total FROM "commissions" WHERE "uid"=$1',
        [uid]
      );
      totalCommissions = parseFloat((commRes.rows?.[0]?.total as string) || '0');
    }

    return NextResponse.json({
      referralCode: refCode,
      refLevel1,
      refLevel2,
      refLevel3,
      totalCommissions,
      walletBalance: Number(u.wallet_balance) || 0,
      totalDirects: Number(u.total_directs) || 0,
      activeDirects: Number(u.active_directs) || 0,
      teamBiz: Number(u.team_biz) || 0,
      legABiz: Number(u.leg_a_biz) || 0,
      legBBiz: Number(u.leg_b_biz) || 0,
      purchasedPackages: u.purchased_packages
        ? typeof u.purchased_packages === 'string'
          ? JSON.parse(u.purchased_packages as string)
          : u.purchased_packages
        : [],
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
