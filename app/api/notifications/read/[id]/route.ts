import { NextRequest, NextResponse } from 'next/server';
import { findWhere, get, update } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { uid } = await request.json();
    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    const rows = await findWhere('notifications', { id }, null, 1);
    if (rows.length) {
      const noti = rows[0];
      const readBy = (noti.read_by as Record<string, boolean>) || {};
      readBy[uid] = true;
      await update('notifications', id, {
        read_by: readBy,
        delete_at: Date.now() + 60000,
      }, 'id');
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
