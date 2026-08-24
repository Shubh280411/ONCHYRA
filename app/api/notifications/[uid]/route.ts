import { NextRequest, NextResponse } from 'next/server';
import { findWhere } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    const userNotis = await findWhere('notifications', { user_id: uid }, 'created_at', 50);
    const globalNotis = await findWhere('notifications', { user_id: 'all' }, 'created_at', 50);

    const all = [...userNotis, ...globalNotis]
      .sort((a, b) => Number(b.created_at || 0) - Number(a.created_at || 0))
      .slice(0, 50);

    return NextResponse.json({ notifications: all });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
