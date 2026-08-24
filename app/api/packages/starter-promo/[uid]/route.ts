import { NextRequest, NextResponse } from 'next/server';
import { findWhere } from '@/lib/db';

const ORIGINAL_STARTER_PRICE = 5;
const STARTER_PROMO_PRICE = 2.5;
const STARTER_PROMO_DURATION_DAYS = 7;

async function getStarterPromoConfig(): Promise<Record<string, unknown> | null> {
  try {
    const rows = await findWhere('settings', { key: 'starterPromo' });
    if (!rows.length) return null;
    let val = rows[0].value;
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
    const rows = await findWhere('package_purchases', { uid, package_id: 'starter' });
    return rows.length > 0;
  } catch {
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const promoConfig = await getStarterPromoConfig();
    const isActive = isStarterPromoActive(promoConfig);
    const hasPurchased = await hasUserPurchasedStarter(uid);

    return NextResponse.json({
      active: isActive,
      hasPurchased,
      originalPrice: ORIGINAL_STARTER_PRICE,
      promoPrice: STARTER_PROMO_PRICE,
      discountPct: 50,
      endDate: isActive ? (promoConfig!.startDate as number) + (STARTER_PROMO_DURATION_DAYS * 24 * 60 * 60 * 1000) : null,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
