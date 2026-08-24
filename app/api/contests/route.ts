import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const now = Date.now();
    const result = await query(
      `SELECT * FROM contests WHERE active = true AND end_time > $1 ORDER BY created_at DESC`,
      [now]
    );

    return NextResponse.json({ contests: result.rows });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
