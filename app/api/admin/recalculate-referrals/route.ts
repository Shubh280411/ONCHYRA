import { NextRequest, NextResponse } from 'next/server';
import { query, get } from '@/lib/db';

async function requireAdmin(request: NextRequest) {
  const uid = request.headers.get('x-auth-uid');
  if (!uid) return { error: 'No uid', status: 401 };
  const admin = await get('admins', uid);
  if (!admin) return { error: 'Not admin', status: 403 };
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const authErr = await requireAdmin(request);
    if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

    const allUsersRes = await query(`SELECT * FROM users`);
    const allUsers = allUsersRes.rows;

    let updated = 0;
    for (const u of allUsers) {
      const code = u.referral_code ? (u.referral_code as string).toUpperCase() : null;
      if (!code) continue;

      const l1Rows = allUsers.filter((x: Record<string, unknown>) =>
        ((x.referred_by as string) || '').toUpperCase() === code
      );
      const refLevel1 = l1Rows.length;

      const l1Codes = l1Rows.map((x: Record<string, unknown>) => ((x.referral_code as string) || '').toUpperCase()).filter(Boolean);
      const l2Rows = l1Codes.length
        ? allUsers.filter((x: Record<string, unknown>) => l1Codes.includes(((x.referred_by as string) || '').toUpperCase()))
        : [];
      const refLevel2 = l2Rows.length;

      const l2Codes = l2Rows.map((x: Record<string, unknown>) => ((x.referral_code as string) || '').toUpperCase()).filter(Boolean);
      const l3Rows = l2Codes.length
        ? allUsers.filter((x: Record<string, unknown>) => l2Codes.includes(((x.referred_by as string) || '').toUpperCase()))
        : [];
      const refLevel3 = l3Rows.length;

      const totalDirects = refLevel1;
      const activeDirects = l1Rows.filter((x: Record<string, unknown>) => x.active_package && x.active_package !== 'none').length;

      const l1Biz = l1Rows.map((x: Record<string, unknown>) => Number(x.total_package_spend) || 0);
      const teamBiz = l1Biz.reduce((a: number, b: number) => a + b, 0);

      let legABiz = 0, legBBiz = 0;
      if (l1Biz.length > 0) {
        const sorted = [...l1Biz].sort((a: number, b: number) => b - a);
        legABiz = sorted[0];
        legBBiz = sorted.slice(1).reduce((a: number, b: number) => a + b, 0);
      }

      const needsUpdate = refLevel1 !== Number(u.ref_level1) || refLevel2 !== Number(u.ref_level2) || refLevel3 !== Number(u.ref_level3) ||
        teamBiz !== Number(u.team_biz) || legABiz !== Number(u.leg_a_biz) || legBBiz !== Number(u.leg_b_biz) ||
        totalDirects !== Number(u.total_directs) || activeDirects !== Number(u.active_directs);

      if (needsUpdate) {
        await query(
          `UPDATE users SET ref_level1=$1, ref_level2=$2, ref_level3=$3, team_biz=$4, leg_a_biz=$5, leg_b_biz=$6, total_directs=$7, active_directs=$8 WHERE uid=$9`,
          [refLevel1, refLevel2, refLevel3, teamBiz, legABiz, legBBiz, totalDirects, activeDirects, u.uid]
        );
        updated++;
      }
    }

    const commSumRes = await query(`SELECT uid, COALESCE(SUM(amount),0) AS total FROM commissions GROUP BY uid`);
    let commUpdated = 0;
    for (const row of commSumRes.rows) {
      await query(`UPDATE users SET total_commissions = $1 WHERE uid = $2`, [row.total, row.uid]);
      commUpdated++;
    }

    return NextResponse.json({ success: true, totalUsers: allUsers.length, updated, commSynced: commUpdated });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
