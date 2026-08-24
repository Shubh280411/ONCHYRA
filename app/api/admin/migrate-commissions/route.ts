import { NextRequest, NextResponse } from 'next/server';
import { get, all, findWhere, increment, incrementMulti, set } from '@/lib/db';

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

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '0');
    const fixBizOnly = searchParams.get('fixBizOnly') === 'true';
    const cutoff = days > 0 ? Date.now() - days * 86400000 : 0;

    const allUsers = await all('users');
    let buyers = allUsers.filter(u => Number(u.package_amount || 0) > 0 || Number(u.total_package_spend || 0) > 0);
    if (cutoff > 0) buyers = buyers.filter(u => Number(u.package_purchased_at || 0) >= cutoff);

    let processed = 0, noReferrer = 0, noUplinePackage = 0, results: string[] = [], errors: string[] = [];
    const levels = [
      { level: 1, pct: 0.10 },
      { level: 2, pct: 0.05 },
      { level: 3, pct: 0.03 },
    ];

    for (const buyer of buyers) {
      try {
        let currentRefCode = buyer.referred_by as string | null;
        if (!currentRefCode) { noReferrer++; continue; }

        const pkgAmount = Number(buyer.package_amount || buyer.total_package_spend) || 0;
        let levelResults: string[] = [];

        for (const lv of levels) {
          if (!currentRefCode) break;
          const refRows = await findWhere('users', { referral_code: currentRefCode });
          if (!refRows.length) break;

          const refUid = refRows[0].uid as string;
          const refData = refRows[0];
          currentRefCode = refData.referred_by as string | null;
          await increment('users', refUid, 'team_biz', pkgAmount);

          if (!fixBizOnly && refData.active_package && refData.active_package !== 'none') {
            const commission = pkgAmount * lv.pct;
            const used = Number(refData.package_usage) || 0;
            const cap = Number(refData.package_cap) || 999999;
            const available = Math.max(0, cap - used);
            const capped = Math.min(commission, available);
            if (capped > 0) {
              await incrementMulti('users', refUid, {
                commission_balance: capped, package_usage: capped, total_commissions: capped,
              });
              await set('commissions', 'adm_' + refUid + '_' + buyer.uid + '_' + Date.now(), {
                from_uid: buyer.uid, uid: refUid, amount: capped, level: lv.level,
                type: 'package_commission', package_name: buyer.active_package || 'Package',
                from_name: (buyer.name as string) || 'User', created_at: Date.now(),
              });
              levelResults.push(`${lv.level}: $${capped.toFixed(2)} to ${refData.name || refUid}`);
            }
          }
        }

        if (levelResults.length > 0 || fixBizOnly) {
          results.push(`${buyer.name || buyer.uid}: ${fixBizOnly ? 'teamBiz updated' : levelResults.join(', ')}`);
          processed++;
        } else {
          noUplinePackage++;
        }
      } catch(e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`${buyer.uid}: ${msg}`);
      }
    }

    return NextResponse.json({
      success: true, processed, noReferrer, noUplinePackage, totalBuyers: buyers.length,
      results: results.slice(0, 50), errors: errors.length, errorDetails: errors.slice(0, 10)
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
