import { NextRequest, NextResponse } from 'next/server';
import { get, findWhere, findWhereIn } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const maxLevel = parseInt(request.nextUrl.searchParams.get('maxLevel') || '1');
    const limitVal = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '10'), 50);
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');

    const user = await get('users', uid);
    if (!user) {
      return NextResponse.json({ levels: { 1: [], 2: [], 3: [] }, total: 0 });
    }

    const refCode = user.referral_code as string;
    if (!refCode) {
      return NextResponse.json({ levels: { 1: [], 2: [], 3: [] }, total: 0 });
    }

    const l1Rows = await findWhere('users', { referred_by: refCode }).catch(() => []);
    const total = l1Rows.length;
    const l1 = l1Rows.slice(offset, offset + limitVal);
    let l2: Record<string, unknown>[] = [];
    let l3: Record<string, unknown>[] = [];

    if (maxLevel >= 2 && l1.length > 0) {
      const l1Codes = l1.map((u) => u.referral_code).filter(Boolean);
      if (l1Codes.length) l2 = await findWhereIn('users', 'referred_by', l1Codes).catch(() => []);
    }

    if (maxLevel >= 3 && l2.length > 0) {
      const l2Codes = l2.map((u) => u.referral_code).filter(Boolean);
      if (l2Codes.length) l3 = await findWhereIn('users', 'referred_by', l2Codes).catch(() => []);
    }

    const clean = (list: Record<string, unknown>[]) =>
      list.map((u) => ({
        uid: u.uid,
        name: u.name,
        email: u.email,
        referralCode: u.referral_code,
        activePackage: u.active_package,
        packageStatus: u.package_status,
        totalPackageSpend: Number(u.total_package_spend) || 0,
        createdAt: u.created_at,
        refLevel1: Number(u.ref_level1) || 0,
        refLevel2: Number(u.ref_level2) || 0,
        refLevel3: Number(u.ref_level3) || 0,
      }));

    return NextResponse.json({
      levels: { 1: clean(l1), 2: clean(l2), 3: clean(l3) },
      total,
      total2: l2.length,
      total3: l3.length,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
