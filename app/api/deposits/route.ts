import { NextResponse } from 'next/server';
import { all } from '@/lib/db';

export async function GET() {
  try {
    const rows = await all('deposits', 'created_at', 50);
    return NextResponse.json(rows);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
