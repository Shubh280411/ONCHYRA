import { NextRequest, NextResponse } from 'next/server';
import { get, set, findWhere } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { uid, contest_id } = await request.json();

    if (!uid || !contest_id) {
      return NextResponse.json({ error: 'uid and contest_id required' }, { status: 400 });
    }

    const contest = await get('contests', contest_id, 'id');
    if (!contest || !contest.active) {
      return NextResponse.json({ error: 'Contest not found or inactive' }, { status: 404 });
    }

    const existing = await findWhere('contest_participants', { user_id: uid, contest_id });
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Already joined' }, { status: 400 });
    }

    await set('contest_participants', crypto.randomUUID(), {
      user_id: uid,
      contest_id,
      joined_at: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
