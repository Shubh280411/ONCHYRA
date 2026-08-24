import { NextRequest, NextResponse } from 'next/server';
import { findWhere, update } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json();
    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    const userNotis = await findWhere('notifications', { user_id: uid });
    const globalNotis = await findWhere('notifications', { user_id: 'all' });
    const all = [...userNotis, ...globalNotis];

    const expiry = Date.now() + 60000;
    for (const noti of all) {
      const readBy = (noti.read_by as Record<string, boolean>) || {};
      if (!readBy[uid]) {
        readBy[uid] = true;
        await update('notifications', noti.id as string, {
          read_by: readBy,
          delete_at: expiry,
        }, 'id');
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
