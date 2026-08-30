import { NextRequest, NextResponse } from 'next/server';
import { get, set } from '@/lib/db';

async function requireAdmin(request: NextRequest) {
  const uid = request.headers.get('x-auth-uid');
  if (!uid) return { error: 'No uid', status: 401 };
  const admin = await get('admins', uid);
  if (!admin) return { error: 'Not admin', status: 403 };
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const authErr = await requireAdmin(request);
    if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

    const { userId, title, message, type, link } = await request.json();
    const notiId = 'noti_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    await set('notifications', notiId, {
      user_id: userId || 'all',
      title,
      message,
      type: type || 'update',
      link: link || '',
      read_by: {},
      created_at: Date.now(),
    }, 'id');
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
