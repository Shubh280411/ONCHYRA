import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json();
    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    const expiry = Date.now() + 60000;
    await query(
      `UPDATE notifications SET read_by = read_by || $1::jsonb, delete_at = $2
       WHERE (user_id = $3 OR user_id = 'all') AND NOT read_by @> $1::jsonb`,
      [JSON.stringify(uid), expiry, uid]
    );

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
