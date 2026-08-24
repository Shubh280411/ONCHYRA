import { NextRequest, NextResponse } from 'next/server';
import { get, set } from '@/lib/db';

const ORIGINAL_STARTER_PRICE = 5;
const STARTER_PROMO_PRICE = 2.50;
const STARTER_PROMO_DURATION_DAYS = 7;

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

    const { active } = await request.json();
    const config = {
      active: !!active,
      startDate: Date.now(),
      durationDays: STARTER_PROMO_DURATION_DAYS,
      originalPrice: ORIGINAL_STARTER_PRICE,
      promoPrice: STARTER_PROMO_PRICE,
      discountPct: 50,
    };
    await set('settings', 'starterPromo', { value: config }, 'key');
    return NextResponse.json({ success: true, config });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
