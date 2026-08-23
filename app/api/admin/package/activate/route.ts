import { NextRequest, NextResponse } from 'next/server';
import { update, increment, get, query } from '@/lib/db';

const PACKAGES: Record<string, { price: number; boost: number; cap: number; name: string }> = {
  starter:  { price: 5,   boost: 4,   cap: 50,   name: 'Starter' },
  builder:  { price: 10,  boost: 8,   cap: 100,  name: 'Builder' },
  pioneer:  { price: 25,  boost: 15,  cap: 250,  name: 'Pioneer' },
  elite:    { price: 50,  boost: 30,  cap: 500,  name: 'Elite' },
  titan:    { price: 100, boost: 60,  cap: 1000, name: 'Titan' },
  dominion: { price: 250, boost: 120, cap: 2500, name: 'Dominion' },
  legacy:   { price: 500, boost: 300, cap: 5000, name: 'Legacy' },
};

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

    const { uid, packageId } = await request.json();
    const pkg = PACKAGES[packageId];
    if (!pkg) return NextResponse.json({ error: 'Invalid package' }, { status: 400 });

    await update('users', uid, {
      active_package: packageId,
      package_amount: pkg.price,
      package_boost: pkg.boost,
      package_cap: pkg.cap,
      package_usage: 0,
      package_status: 'active',
      package_purchased_at: Date.now(),
    });
    await increment('users', uid, 'total_package_spend', pkg.price);

    // Inline referral commission processing
    const user = await get('users', uid);
    if (user && user.referred_by) {
      const levels = [
        { level: 1, pct: 0.10 },
        { level: 2, pct: 0.05 },
        { level: 3, pct: 0.03 },
      ];
      let currentRefCode = user.referred_by as string;
      for (const lv of levels) {
        if (!currentRefCode) break;
        const refRows = await query(
          `SELECT * FROM "users" WHERE UPPER("referral_code") = $1`,
          [currentRefCode.toUpperCase()]
        );
        if (!refRows.rows.length) break;
        const refData = refRows.rows[0];
        const refUid = refData.uid as string;
        currentRefCode = refData.referred_by as string;

        await increment('users', refUid, 'team_biz', pkg.price);

        if (!refData.active_package || refData.active_package === 'none' || refData.package_status === 'expired') continue;

        const commission = pkg.price * lv.pct;
        const used = (refData.package_usage as number) || 0;
        const cap = (refData.package_cap as number) || Infinity;
        const available = Math.max(0, cap - used);
        const capped = Math.min(commission, available);
        if (capped <= 0) continue;

        await increment('users', refUid, 'commission_balance', capped);
        await increment('users', refUid, 'package_usage', capped);
        await increment('users', refUid, 'total_commissions', capped);

        if (used + capped >= cap) {
          await update('users', refUid, { package_status: 'expired' });
        }

        await query(
          `INSERT INTO commissions (id, from_uid, uid, amount, level, type, package_name, from_name, created_at)
           VALUES ($1, $2, $3, $4, $5, 'package_commission', $6, $7, $8)`,
          ['comm_' + refUid + '_' + uid + '_' + Date.now(), uid, refUid, capped, lv.level,
           pkg.name, (user.name as string) || 'User', Date.now()]
        );
      }
    }

    return NextResponse.json({ success: true, package: pkg.name });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
