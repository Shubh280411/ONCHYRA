import { NextRequest, NextResponse } from 'next/server';
import { update, get, all } from '@/lib/db';

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

    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const allUsers = await all('users');
    const users = allUsers.filter(u => {
      const lastClaim = Number(u.last_claim || u.lastclaim) || 0;
      return (lastClaim === 0 || lastClaim < threeDaysAgo) && u.email && u.email !== '';
    });

    if (!users.length) return NextResponse.json({ success: true, sent: 0, failed: 0, total: 0, message: 'No inactive users found' });

    let sent = 0, failed = 0;
    for (const u of users) {
      try {
        console.log(`[EMAIL-INACTIVE] Would send to ${u.email}`);
        sent++;
        update('users', u.uid as string, { last_email_sent_at: Date.now() }).catch(() => {});
      } catch {
        failed++;
      }
      if (sent + failed < users.length) {
        await new Promise(r => setTimeout(r, 250));
      }
    }
    return NextResponse.json({ success: true, sent, failed, total: users.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
