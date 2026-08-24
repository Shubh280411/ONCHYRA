import { NextRequest, NextResponse } from 'next/server';
import { get, findWhere, increment, set } from '@/lib/db';

async function requireAdmin(request: NextRequest) {
  const uid = request.headers.get('x-auth-uid');
  if (!uid) return { error: 'No uid', status: 401 };
  const admin = await get('admins', uid);
  if (!admin) return { error: 'Not admin', status: 403 };
  return null;
}

const PACKAGES: Record<string, { price: number; name: string }> = {
  starter: { price: 5, name: 'Starter' },
  builder: { price: 10, name: 'Builder' },
  pioneer: { price: 25, name: 'Pioneer' },
  elite: { price: 50, name: 'Elite' },
  titan: { price: 100, name: 'Titan' },
  dominion: { price: 250, name: 'Dominion' },
  legacy: { price: 500, name: 'Legacy' },
};

export async function POST(request: NextRequest) {
  try {
    const authErr = await requireAdmin(request);
    if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

    const { uid, packageId } = await request.json();
    if (!uid || !packageId) return NextResponse.json({ error: 'Missing uid or packageId' }, { status: 400 });
    const pkg = PACKAGES[packageId];
    if (!pkg) return NextResponse.json({ error: 'Invalid package' }, { status: 400 });

    const user = await get('users', uid);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!user.referred_by) return NextResponse.json({ success: true, commissions: [] });

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
      await increment('users', refUid, 'team_biz', Number(user.total_package_spend) || 0);

      if (!refData.active_package || refData.active_package === 'none') {
        currentRefCode = refData.referred_by as string;
        continue;
      }

      const pkgAmount = Number(user.package_amount) || 0;
      const commission = pkgAmount * lv.pct;
      const used = Number(refData.package_usage) || 0;
      const cap = Number(refData.package_cap) || 999999;
      const available = Math.max(0, cap - used);
      const capped = Math.min(commission, available);

      if (capped > 0) {
        const commId = 'cpp_' + refUid + '_' + uid + '_' + lv.level;
        const existing = await findWhere('commissions', { id: commId });
        if (!existing.length) {
          await increment('users', refUid, 'commission_balance', capped);
          await increment('users', refUid, 'package_usage', capped);
          await increment('users', refUid, 'total_commissions', capped);
          await set('commissions', commId, {
            from_uid: uid,
            uid: refUid,
            amount: capped,
            level: lv.level,
            type: 'package_commission',
            package_name: user.active_package || 'Package',
            from_name: (user.name as string) || 'User',
            created_at: Date.now(),
          });
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
