import { NextRequest, NextResponse } from 'next/server';
import { get, findWhere, increment, incrementMulti, query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json();
    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    const user = await get('users', uid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.referred_by) {
      return NextResponse.json({ success: true, commissions: [] });
    }

    const levels = [
      { level: 1, pct: 0.10 },
      { level: 2, pct: 0.05 },
      { level: 3, pct: 0.03 },
    ];

    let currentRefCode = user.referred_by as string;
    const results: { level: number; uid: string; amount: number }[] = [];

    for (const lv of levels) {
      if (!currentRefCode) break;
      const refRows = await findWhere('users', { referral_code: currentRefCode });
      if (!refRows.length) break;

      const refUid = refRows[0].uid as string;
      const refData = refRows[0];

      // Update teamBiz
      await increment('users', refUid, 'team_biz', (user.total_package_spend as number) || 0);

      if (!refData.active_package || refData.active_package === 'none') {
        currentRefCode = refData.referred_by as string;
        continue;
      }

      const pkgAmount = (user.package_amount as number) || 0;
      const commission = pkgAmount * lv.pct;
      const used = (refData.package_usage as number) || 0;
      const cap = (refData.package_cap as number) || 999999;
      const available = Math.max(0, cap - used);
      const capped = Math.min(commission, available);

      if (capped > 0) {
        const commId = 'cpp_' + refUid + '_' + uid + '_' + lv.level;
        const existing = await findWhere('commissions', { id: commId });
        if (!existing.length) {
          await incrementMulti('users', refUid, {
            commission_balance: capped,
            package_usage: capped,
            total_commissions: capped,
          });
          await query(
            `INSERT INTO commissions (id, from_uid, uid, amount, level, type, package_name, from_name, created_at)
             VALUES ($1, $2, $3, $4, $5, 'package_commission', $6, $7, $8)`,
            [
              commId,
              uid,
              refUid,
              capped,
              lv.level,
              (user.active_package as string) || 'Package',
              (user.name as string) || 'User',
              Date.now(),
            ]
          );
          results.push({ level: lv.level, uid: refUid, amount: capped });
        }
      }

      currentRefCode = refData.referred_by as string;
    }

    return NextResponse.json({ success: true, commissions: results });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
