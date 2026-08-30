import { NextRequest, NextResponse } from 'next/server';
import { all, findWhere } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const uid = request.nextUrl.searchParams.get('uid');
    const polls = await all('polls', 'created_at');

    let votedMap: Record<string, string> = {};
    if (uid) {
      const allVotes = await findWhere('poll_votes', { user_id: uid });
      for (const v of allVotes) {
        votedMap[v.poll_id as string] = v.choice as string;
      }
    }

    const result = polls.map((p: Record<string, unknown>) => ({
      ...p,
      voted: votedMap[p.id as string] || null,
    }));

    return NextResponse.json({ polls: result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
