import { NextResponse } from 'next/server';
import { all } from '@/lib/db';

export async function GET() {
  try {
    const now = Date.now();
    const drops = await all('powerdrops', 'start_time', 100);
    const active = drops.filter(d => {
      const startTime = Number(d.start_time) || 0;
      const duration = Number(d.duration) || 1;
      const count = Number(d.participants_count) || 0;
      const max = Number(d.max_participants) || 0;
      return (max === 0 || count < max) && (startTime + duration * 86400000 > now);
    });
    return NextResponse.json({ powerdrops: active });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
