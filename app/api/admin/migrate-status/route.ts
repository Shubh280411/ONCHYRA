import { NextRequest, NextResponse } from 'next/server';
import { query, update, get } from '@/lib/db';

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

    const rows = await query(`SELECT uid, status FROM users WHERE status IS NULL OR status = ''`);
    let count = 0;
    for (const r of rows.rows) {
      await update('users', r.uid as string, { status: 'active' });
      count++;
    }
    return NextResponse.json({ success: true, message: `${count} users updated with status: active` });
  } catch (err: unknown) {
    console.error('migrate error:', err);
    return NextResponse.json({ success: false, message: 'Migration failed' }, { status: 500 });
  }
}
