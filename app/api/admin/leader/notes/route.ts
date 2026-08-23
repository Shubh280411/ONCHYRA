import { NextRequest, NextResponse } from 'next/server';
import { arrayAppend, get } from '@/lib/db';

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

    const { uid, note } = await request.json();
    if (!uid || !note) return NextResponse.json({ error: 'Missing uid or note' }, { status: 400 });
    const entry = { text: note, addedBy: 'admin', createdAt: Date.now() };
    await arrayAppend('users', uid, 'admin_notes', entry);
    return NextResponse.json({ success: true, entry });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
