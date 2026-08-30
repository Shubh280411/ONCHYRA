import { NextRequest, NextResponse } from 'next/server';
import { all } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const uid = request.headers.get('x-auth-uid');
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let notifications: Record<string, unknown>[] = [];
    try {
      notifications = await all('notifications');
    } catch {
      notifications = [];
    }

    return NextResponse.json({ count: notifications.length });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
