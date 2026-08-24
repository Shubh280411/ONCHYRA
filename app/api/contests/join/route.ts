import { NextRequest, NextResponse } from 'next/server';
import { query, get } from '@/lib/db';

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

    const existing = await query(
      `SELECT id FROM contest_participants WHERE user_id = $1 AND contest_id = $2`,
      [uid, contest_id]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Already joined' }, { status: 400 });
    }

    await query(
      `INSERT INTO contest_participants (id, user_id, contest_id, joined_at) VALUES ($1, $2, $3, $4)`,
      [crypto.randomUUID(), uid, contest_id, Date.now()]
    );

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
