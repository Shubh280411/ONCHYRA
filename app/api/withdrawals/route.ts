import { NextRequest, NextResponse } from 'next/server';
import { get, query } from '@/lib/db';

async function requireAdmin(request: NextRequest) {
  const uid = request.headers.get('x-auth-uid');
  if (!uid) return { error: 'No uid', status: 401 };
  const admin = await get('admins', uid);
  if (!admin) return { error: 'Not admin', status: 403 };
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const rows = await query(`SELECT * FROM withdrawals ORDER BY created_at DESC LIMIT 100`);
    const list = [];
    for (const w of rows.rows) {
      const u = await get('users', w.uid as string);
      list.push({
        id: w.id,
        ...w,
        userName: u ? (u.name || u.referral_code) : '?',
      });
    }
    return NextResponse.json(list);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
