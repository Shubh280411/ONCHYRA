import { NextRequest, NextResponse } from 'next/server';
import { all } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    if (request.headers.get('x-auth-uid') !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const polls = await all('polls', 'created_at');
    return NextResponse.json(polls);
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
