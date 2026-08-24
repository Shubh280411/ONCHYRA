import { NextRequest, NextResponse } from 'next/server';
import { get, all, update, findWhere } from '@/lib/db';

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

    const allUsers = await all('users');

    let updated = 0;
    for (const u of allUsers) {
      const code = u.referral_code ? (u.referral_code as string).toUpperCase() : null;
      if (!code) continue;

      const l1Rows = allUsers.filter(x => ((x.referred_by as string) || '').toUpperCase() === code);
      const refLevel1 = l1Rows.length;

      const l1Codes = l1Rows.map(x => ((x.referral_code as string) || '').toUpperCase()).filter(Boolean);
      const l2Rows = l1Codes.length
        ? allUsers.filter(x => l1Codes.includes(((x.referred_by as string) || '').toUpperCase()))
        : [];
      const refLevel2 = l2Rows.length;

      const l2Codes = l2Rows.map(x => ((x.referral_code as string) || '').toUpperCase()).filter(Boolean);
      const l3Rows = l2Codes.length
        ? allUsers.filter(x => l2Codes.includes(((x.referred_by as string) || '').toUpperCase()))
        : [];
      const refLevel3 = l3Rows.length;

      const totalDirects = refLevel1;
      const activeDirects = l1Rows.filter(x => x.active_package && x.active_package !== 'none').length;

      const l1Biz = l1Rows.map(x => Number(x.total_package_spend) || 0);
      const teamBiz = l1Biz.reduce((a, b) => a + b, 0);

      let legABiz = 0, legBBiz = 0;
      if (l1Biz.length > 0) {
        const sorted = [...l1Biz].sort((a, b) => b - a);
        legABiz = sorted[0];
        legBBiz = sorted.slice(1).reduce((a, b) => a + b, 0);
      }

      const needsUpdate = refLevel1 !== Number(u.ref_level1) || refLevel2 !== Number(u.ref_level2) || refLevel3 !== Number(u.ref_level3) ||
        teamBiz !== Number(u.team_biz) || legABiz !== Number(u.leg_a_biz) || legBBiz !== Number(u.leg_b_biz) ||
        totalDirects !== Number(u.total_directs) || activeDirects !== Number(u.active_directs);

      if (needsUpdate) {
        await update('users', u.uid as string, {
          ref_level1: refLevel1, ref_level2: refLevel2, ref_level3: refLevel3,
          team_biz: teamBiz, leg_a_biz: legABiz, leg_b_biz: legBBiz,
          total_directs: totalDirects, active_directs: activeDirects,
        });
        updated++;
      }
    }

    let commUpdated = 0;
    const allComms = await all('commissions');
    const commByUser: Record<string, number> = {};
    for (const c of allComms) {
      const uid = c.uid as string;
      commByUser[uid] = (commByUser[uid] || 0) + (Number(c.amount) || 0);
    }
    for (const [uid, total] of Object.entries(commByUser)) {
      await update('users', uid, { total_commissions: total });
      commUpdated++;
    }

    return NextResponse.json({ success: true, totalUsers: allUsers.length, updated, commSynced: commUpdated });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
