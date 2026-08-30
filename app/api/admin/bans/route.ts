import { NextRequest, NextResponse } from 'next/server';
import { findWhere, get, set, update, all } from '@/lib/db';

async function requireAdmin(request: NextRequest) {
  const uid = request.headers.get('x-auth-uid');
  if (!uid) return { error: 'No uid', status: 401 };
  const admin = await get('admins', uid);
  if (!admin) return { error: 'Not admin', status: 403 };
  return null;
}

async function banUser(uid: string, banReason: string) {
  const user = await get('users', uid);
  if (!user) return false;
  await set('users', uid, { ...user, banned: true, ban_reason: banReason || 'No reason provided', banned_at: Date.now() }, 'uid');
  return true;
}

async function unbanUser(uid: string) {
  const user = await get('users', uid);
  if (!user) return false;
  await set('users', uid, { ...user, banned: false, ban_reason: '', banned_at: 0 }, 'uid');
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const authErr = await requireAdmin(request);
    if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

    const { uid, action, reason, appealId } = await request.json();

    if (action === 'ban') {
      if (!uid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
      const ok = await banUser(uid, reason);
      if (!ok) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      return NextResponse.json({ success: true, message: 'User banned successfully' });
    }

    if (action === 'unban') {
      if (!uid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
      const ok = await unbanUser(uid);
      if (!ok) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      return NextResponse.json({ success: true, message: 'User unbanned successfully' });
    }

    if (action === 'approve_appeal') {
      if (!appealId) return NextResponse.json({ error: 'Missing appealId' }, { status: 400 });
      const appeal = await get('notifications', appealId);
      if (!appeal) return NextResponse.json({ error: 'Appeal not found' }, { status: 404 });
      await update('notifications', appealId, { status: 'approved', reviewed_at: Date.now() });
      await unbanUser(appeal.user_id as string);
      return NextResponse.json({ success: true, message: 'Appeal approved, user unbanned' });
    }

    if (action === 'reject_appeal') {
      if (!appealId) return NextResponse.json({ error: 'Missing appealId' }, { status: 400 });
      await update('notifications', appealId, { status: 'rejected', reviewed_at: Date.now() });
      return NextResponse.json({ success: true, message: 'Appeal rejected' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authErr = await requireAdmin(request);
    if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

    const allUsers = await findWhere('users', {});
    const bannedUsers = allUsers.filter(u => u.banned);
    const appeals = await findWhere('notifications', { type: 'ban_appeal' });
    appeals.sort((a, b) => (b.created_at as number) - (a.created_at as number));
    return NextResponse.json({
      bannedUsers: bannedUsers.map(u => ({
        uid: u.uid,
        name: u.name,
        email: u.email,
        ban_reason: u.ban_reason,
        banned_at: u.banned_at,
        referral_code: u.referral_code,
      })),
      appeals: appeals.map(a => ({
        id: a.id,
        uid: a.user_id,
        user_name: a.user_name,
        user_email: a.user_email,
        ban_reason: a.ban_reason,
        appeal_reason: a.message,
        status: a.status,
        created_at: a.created_at,
        reviewed_at: a.reviewed_at,
      })),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
