import { NextRequest, NextResponse } from 'next/server';
import { set } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    if (request.headers.get('x-auth-uid') !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { question, options } = await request.json();
    if (!question || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ error: 'Question and at least 2 options required' }, { status: 400 });
    }
    const id = crypto.randomUUID();
    await set('polls', id, {
      question,
      options,
      results: {},
      created_at: Date.now(),
    }, 'id');
    return NextResponse.json({ success: true, id });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
