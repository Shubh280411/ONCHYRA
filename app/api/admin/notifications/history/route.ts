import { NextRequest, NextResponse } from 'next/server';
import { all } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const uid = request.headers.get('x-auth-uid');
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let notifications: Record<string, unknown>[] = [];
    try {
      notifications = await all('notifications', 'created_at', 200);
    } catch {
      notifications = [];
    }

    const sorted = notifications
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(b.created_at || 0) - Number(a.created_at || 0))
      .map((n: Record<string, unknown>) => ({
        id: n.id || '',
        type: n.type || 'update',
        title: n.title || '',
        message: n.message || '',
        userId: n.user_id || 'all',
        link: n.link || '',
        createdAt: Number(n.created_at) || 0,
      }));

    return NextResponse.json(sorted);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
