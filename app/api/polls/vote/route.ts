import { NextRequest, NextResponse } from 'next/server';
import { get, findWhere, set, update } from '@/lib/db';

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

    const existing = await findWhere('poll_votes', { user_id: uid, poll_id });
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Already voted' }, { status: 400 });
    }

    const voteId = crypto.randomUUID();
    await set('poll_votes', voteId, {
      user_id: uid,
      poll_id,
      choice,
      created_at: Date.now(),
    });

    const currentResults = (poll.results as Record<string, number>) || {};
    currentResults[choice] = (currentResults[choice] || 0) + 1;

    await update('polls', poll_id, { results: currentResults }, 'id');

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
