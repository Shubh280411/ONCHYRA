import { NextRequest, NextResponse } from 'next/server';
import { get, query, increment, update, set } from '@/lib/db';

const PACKAGES: Record<string, { price: number; boost: number; cap: number; name: string }> = {
  starter:  { price: 5,   boost: 4,   cap: 50,   name: 'Starter' },
  builder:  { price: 10,  boost: 8,   cap: 100,  name: 'Builder' },
  pioneer:  { price: 25,  boost: 15,  cap: 250,  name: 'Pioneer' },
  elite:    { price: 50,  boost: 30,  cap: 500,  name: 'Elite' },
  titan:    { price: 100, boost: 60,  cap: 1000, name: 'Titan' },
  dominion: { price: 250, boost: 120, cap: 2500, name: 'Dominion' },
  legacy:   { price: 500, boost: 300, cap: 5000, name: 'Legacy' },
};

const ORIGINAL_STARTER_PRICE = 5;
const STARTER_PROMO_PRICE = 2.5;
const STARTER_PROMO_DURATION_DAYS = 7;

let promoColumnReady = false;
async function ensurePromoColumn() {
  if (promoColumnReady) return;
  try {
    await query("ALTER TABLE package_purchases ADD COLUMN IF NOT EXISTS promo_applied BOOLEAN DEFAULT FALSE");
    promoColumnReady = true;
  } catch (e: unknown) {
    console.error('Failed to add promo_applied column:', e instanceof Error ? e.message : String(e));
  }
}

async function getStarterPromoConfig(): Promise<Record<string, unknown> | null> {
  try {
    const res = await query("SELECT value FROM settings WHERE key = 'starterPromo'");
    let val = (res.rows[0] as Record<string, unknown>)?.value;
    if (typeof val === 'string') val = JSON.parse(val);
    return val as Record<string, unknown> | null;
  } catch {
    return null;
  }
}

function isStarterPromoActive(promoConfig: Record<string, unknown> | null): boolean {
  if (!promoConfig || !promoConfig.active) return false;
  const elapsed = Date.now() - (promoConfig.startDate as number);
  const maxDuration = STARTER_PROMO_DURATION_DAYS * 24 * 60 * 60 * 1000;
  return elapsed <= maxDuration;
}

async function hasUserPurchasedStarter(uid: string): Promise<boolean> {
  try {
    const res = await query(
      "SELECT COUNT(*) FROM package_purchases WHERE uid = $1 AND package_id = $2",
      [uid, 'starter']
    );
    return parseInt(res.rows[0]?.count as string || '0') > 0;
  } catch {
    return false;
  }
}

async function lookupByRefCode(refCode: string) {
  if (!refCode) return null;
  const code = refCode.toUpperCase();
  const res = await query('SELECT * FROM "users" WHERE UPPER("referral_code") = $1', [code]);
  if (!res.rows.length) return null;
  return { id: res.rows[0].uid as string, data: res.rows[0] as Record<string, unknown> };
}

async function processReferralCommission(uid: string, amount: number, pkgName: string) {
  try {
    const user = await get('users', uid);
    if (!user || !user.referred_by) return;

    const levels = [
      { level: 1, pct: 0.10 },
      { level: 2, pct: 0.05 },
      { level: 3, pct: 0.03 },
    ];

    let currentRefCode = user.referred_by as string;
    for (const lv of levels) {
      if (!currentRefCode) break;
      const refLookup = await lookupByRefCode(currentRefCode);
      if (!refLookup) break;
      const refUid = refLookup.id;
      const refData = refLookup.data;
      currentRefCode = refData.referred_by as string;
      await increment('users', refUid, 'team_biz', amount);

      if (!refData.active_package || refData.active_package === 'none' || refData.package_status === 'expired') {
        continue;
      }

      const commission = amount * lv.pct;
      const used = (refData.package_usage as number) || 0;
      const cap = (refData.package_cap as number) || Infinity;
      const available = Math.max(0, cap - used);
      const capped = Math.min(commission, available);
      if (capped <= 0) continue;
      const newUsed = used + capped;

      await increment('users', refUid, 'commission_balance', capped);
      await increment('users', refUid, 'package_usage', capped);
      await increment('users', refUid, 'total_commissions', capped);

      if (newUsed >= cap) {
        await update('users', refUid, { package_status: 'expired' });
      }

      await query(
        `INSERT INTO commissions (id, from_uid, uid, amount, level, type, package_name, from_name, created_at)
         VALUES ($1, $2, $3, $4, $5, 'package_commission', $6, $7, $8)`,
        ['comm_' + refUid + '_' + uid + '_' + Date.now(), uid, refUid, capped, lv.level,
         pkgName || 'Package', (user.name as string) || 'User', Date.now()]
      );
    }
  } catch (e: unknown) {
    console.error('Referral commission error:', e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, packageId } = body;

    const pkg = PACKAGES[packageId];
    if (!pkg) return NextResponse.json({ error: 'Invalid package' }, { status: 400 });

    const user = await get('users', uid);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (user.active_package && user.active_package !== 'none' && user.package_status !== 'expired') {
      return NextResponse.json({ error: 'Already has an active package. Upgrade instead.' }, { status: 400 });
    }

    let pkgPrice = pkg.price;
    let promoApplied = false;

    if (packageId === 'starter') {
      const promoConfig = await getStarterPromoConfig();
      if (isStarterPromoActive(promoConfig)) {
        const alreadyPurchased = await hasUserPurchasedStarter(uid);
        if (alreadyPurchased) {
          return NextResponse.json({ error: 'Starter package promo limited to one per account. You can purchase another package instead.' }, { status: 400 });
        }
        pkgPrice = STARTER_PROMO_PRICE;
        promoApplied = true;
      }
    }

    let credit = 0;
    if (user.active_package && user.active_package !== 'none') {
      const currentPkg = PACKAGES[user.active_package as string];
      if (currentPkg) {
        const usagePct = ((user.package_usage as number) || 0) / currentPkg.cap;
        if (usagePct < 5) credit = currentPkg.price * 0.7;
      }
    }

    const finalPrice = Math.max(0, pkgPrice - credit);
    if ((user.wallet_balance as number || 0) < finalPrice) {
      return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });
    }

    const prevCap = user.active_package && user.active_package !== 'none' && PACKAGES[user.active_package as string]
      ? PACKAGES[user.active_package as string].cap
      : 0;

    await ensurePromoColumn();

    const freshUser = await get('users', uid);
    const freshBalance = Number(freshUser?.wallet_balance || 0);
    if (freshBalance < finalPrice) {
      return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });
    }

    await update('users', uid, {
      wallet_balance: freshBalance - finalPrice,
      active_package: packageId,
      package_amount: pkgPrice,
      package_boost: pkg.boost,
      package_cap: prevCap + pkg.cap,
      package_usage: 0,
      package_status: 'active',
      package_purchased_at: Date.now(),
      total_package_spend: (Number(user.total_package_spend || 0)) + pkgPrice,
    });

    await set('package_purchases', 'pp_' + uid + '_' + Date.now(), {
      id: 'pp_' + uid + '_' + Date.now(),
      uid,
      package_id: packageId,
      name: pkg.name,
      amount: pkgPrice,
      paid: finalPrice,
      credit,
      boost: pkg.boost,
      promo_applied: promoApplied,
      created_at: Date.now(),
    });

    await processReferralCommission(uid, pkgPrice, pkg.name);

    return NextResponse.json({ success: true, package: pkg.name, boost: pkg.boost, credit, paid: finalPrice, promoApplied });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
