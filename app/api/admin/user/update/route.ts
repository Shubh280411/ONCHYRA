import { NextRequest, NextResponse } from 'next/server';
import { update, get } from '@/lib/db';
import { camelToSnake } from '@/lib/utils';

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

    const { uid, updates } = await request.json();
    if (!uid || !updates) return NextResponse.json({ error: 'Missing uid or updates' }, { status: 400 });

    const dbUpdates = camelToSnake(updates as Record<string, unknown>);
    await update('users', uid, dbUpdates);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
