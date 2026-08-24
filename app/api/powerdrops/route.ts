import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const now = Date.now();
    const result = await query(
      `SELECT * FROM powerdrops
       WHERE (participants_count IS NULL OR participants_count < max_participants)
       AND start_time + (COALESCE(duration, 1) * 86400000) > $1
       ORDER BY start_time DESC`,
      [now]
    );

    return NextResponse.json({ powerdrops: result.rows });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
