import { NextRequest, NextResponse } from 'next/server';
import { findWhere } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    if (!uid) {
      return NextResponse.json({ error: 'uid required' }, { status: 400 });
    }

    const history = await findWhere('roi_history', { uid }, 'created_at');

    return NextResponse.json({
      uid,
      history: history.map((row) => ({
        id: row.id,
        uid: row.uid,
        amount: Number(row.amount) || 0,
        packageId: row.package_id,
        dayNumber: row.day_number,
        createdAt: Number(row.created_at) || 0,
      })),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
