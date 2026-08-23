import { NextRequest, NextResponse } from 'next/server';
import { update, get } from '@/lib/db';

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

    const { uid, status } = await request.json();
    if (!uid || !status) return NextResponse.json({ error: 'Missing uid or status' }, { status: 400 });
    const valid = ['active', 'under_review', 'restricted', 'suspended'];
    if (!valid.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    await update('users', uid, { leader_status: status });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
