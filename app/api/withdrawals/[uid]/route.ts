import { NextRequest, NextResponse } from 'next/server';
import { findWhere } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const rows = await findWhere('withdrawals', { uid }, 'created_at', 50);
    return NextResponse.json(rows);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
