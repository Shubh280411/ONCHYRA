import { NextRequest, NextResponse } from 'next/server';
import { findWhere } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const upperCode = code.toUpperCase();

    const rows = await findWhere('users', { referral_code: upperCode });
    if (rows.length) {
      const d = rows[0];
      return NextResponse.json({
        valid: true,
        uid: d.uid,
        name: d.name,
        referredBy: d.referred_by || null,
      });
    }

    return NextResponse.json({ valid: false });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
