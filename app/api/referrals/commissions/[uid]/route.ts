import { NextRequest, NextResponse } from 'next/server';
import { findWhere } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const rows = await findWhere('commissions', { uid }, 'created_at', 30).catch(() => []);
    const commissions = rows.map((r) => ({
      id: r.id,
      amount: Number(r.amount) || 0,
      level: Number(r.level) || 0,
      type: r.type,
      packageName: r.package_name,
      fromName: r.from_name,
      createdAt: r.created_at,
    }));
    return NextResponse.json({ commissions });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
