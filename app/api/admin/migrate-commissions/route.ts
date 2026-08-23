import { NextRequest, NextResponse } from 'next/server';
import { query, get, findWhere, increment, incrementMulti } from '@/lib/db';

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

    const usersRes = await query(`SELECT * FROM users`);
    const allUsers = usersRes.rows;
    let buyers = allUsers.filter((u: Record<string, unknown>) =>
      (u.package_amount as number || 0) > 0 || (u.total_package_spend as number || 0) > 0
    );
    if (cutoff > 0) buyers = buyers.filter((u: Record<string, unknown>) =>
      (u.package_purchased_at as number || 0) >= cutoff
    );

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

        const pkgAmount = (buyer.package_amount as number) || (buyer.total_package_spend as number) || 0;
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
            const used = (refData.package_usage as number) || 0;
            const cap = (refData.package_cap as number) || 999999;
            const available = Math.max(0, cap - used);
            const capped = Math.min(commission, available);
            if (capped > 0) {
              await incrementMulti('users', refUid, {
                commission_balance: capped,
                package_usage: capped,
                total_commissions: capped,
              });
              await query(
                `INSERT INTO commissions (id, from_uid, uid, amount, level, type, package_name, from_name, created_at)
                 VALUES ($1, $2, $3, $4, $5, 'package_commission', $6, $7, $8)`,
                ['adm_' + refUid + '_' + buyer.uid + '_' + Date.now(), buyer.uid, refUid, capped, lv.level, buyer.active_package || 'Package', buyer.name || 'User', Date.now()]
              );
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
