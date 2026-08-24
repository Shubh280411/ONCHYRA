import { NextRequest, NextResponse } from 'next/server';
import { get, all } from '@/lib/db';

async function requireAdmin(request: NextRequest) {
  const uid = request.headers.get('x-auth-uid');
  if (!uid) return { error: 'No uid', status: 401 };
  const admin = await get('admins', uid);
  if (!admin) return { error: 'Not admin', status: 403 };
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const authErr = await requireAdmin(request);
    if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

    const rows = await all('withdrawals', 'created_at', 100);
    const list = [];
    for (const w of rows) {
      const u = await get('users', w.uid as string);
      list.push({
        id: w.id,
        ...w,
        userName: u ? ((u.name as string) || (u.referral_code as string)) : '?',
      });
    }
    return NextResponse.json(list);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
