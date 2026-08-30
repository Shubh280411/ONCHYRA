import { NextRequest, NextResponse } from 'next/server';
import { set, findWhere, get } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { uid, reason } = await request.json();
    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    const user = await get('users', uid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.banned) {
      return NextResponse.json({ error: 'Account is not banned' }, { status: 400 });
    }

    const existingAppeals = await findWhere('notifications', { type: 'ban_appeal', user_id: uid });
    const pendingAppeal = existingAppeals.find(a => a.status === 'pending');
    if (pendingAppeal) {
      return NextResponse.json({ error: 'You already have a pending appeal' }, { status: 400 });
    }

    const appealId = 'ban_appeal_' + uid + '_' + Date.now();
    await set('notifications', appealId, {
      user_id: uid,
      title: 'Ban Appeal',
      message: reason || 'No reason provided',
      type: 'ban_appeal',
      status: 'pending',
      user_name: user.name || 'Unknown',
      user_email: user.email || '',
      ban_reason: user.ban_reason || '',
      readBy: [],
      created_at: Date.now(),
    });

    return NextResponse.json({ success: true, message: 'Appeal submitted successfully' });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const appeals = await findWhere('notifications', { type: 'ban_appeal' });
    appeals.sort((a, b) => (b.created_at as number) - (a.created_at as number));
    return NextResponse.json({ appeals });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
