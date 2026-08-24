import { NextRequest, NextResponse } from 'next/server';
import { get, update, all } from '@/lib/db';

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

    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const rows = await all('users');
    let active = 0, inactive = 0, skipped = 0, total = 0;
    for (const u of rows) {
      total++;
      if (u.role === 'admin') { skipped++; continue; }
      const lastClaim = Number(u.last_claim || u.lastclaim) || 0;
      const claimedRecently = lastClaim > 0 && (now - lastClaim) < SEVEN_DAYS;
      if (claimedRecently) active++; else inactive++;
      await update('users', u.uid as string, { status: claimedRecently ? 'active' : 'inactive' });
    }
    return NextResponse.json({ success: true, total, active, inactive, skipped });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
