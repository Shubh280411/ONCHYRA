import { NextResponse } from 'next/server';
import { findWhere } from '@/lib/db';

export async function GET() {
  try {
    const now = Date.now();
    const contests = await findWhere('contests', { active: 'true' }, 'created_at', 50);
    const active = contests.filter(c => Number(c.end_time || 0) > now);
    return NextResponse.json({ contests: active });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
