import { NextRequest, NextResponse } from 'next/server';
import { query, get } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { uid, poll_id, choice } = await request.json();

    if (!uid || !poll_id || choice === undefined) {
      return NextResponse.json({ error: 'uid, poll_id, and choice required' }, { status: 400 });
    }

    const poll = await get('polls', poll_id, 'id');
    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    const existing = await query(
      `SELECT id FROM poll_votes WHERE user_id = $1 AND poll_id = $2`,
      [uid, poll_id]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Already voted' }, { status: 400 });
    }

    await query(
      `INSERT INTO poll_votes (id, user_id, poll_id, choice, created_at) VALUES ($1, $2, $3, $4, $5)`,
      [crypto.randomUUID(), uid, poll_id, choice, Date.now()]
    );

    const currentResults = (poll.results as Record<string, number>) || {};
    currentResults[choice] = (currentResults[choice] || 0) + 1;

    await query(
      `UPDATE polls SET results = $1 WHERE id = $2`,
      [JSON.stringify(currentResults), poll_id]
    );

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
