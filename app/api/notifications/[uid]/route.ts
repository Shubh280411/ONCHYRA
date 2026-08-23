import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cc } from '@/lib/utils';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    // Auto-delete expired notifications
    await query(`DELETE FROM notifications WHERE delete_at IS NOT NULL AND delete_at < $1`, [Date.now()]);

    const result = await query(
      `SELECT * FROM notifications WHERE user_id = $1 OR user_id = 'all' ORDER BY created_at DESC LIMIT 50`,
      [uid]
    );

    return NextResponse.json({ notifications: result.rows.map(cc) });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
