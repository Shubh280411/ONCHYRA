import { NextResponse } from 'next/server';
import { all } from '@/lib/db';

export async function GET() {
  try {
    const polls = await all('polls', 'created_at');
    return NextResponse.json({ polls });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
