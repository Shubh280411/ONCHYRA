import { NextRequest, NextResponse } from 'next/server';
import { query, get } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { event_id, address } = await request.json();

    if (!event_id || !address) {
      return NextResponse.json({ error: 'event_id and address required' }, { status: 400 });
    }

    const powerdrop = await get('powerdrops', event_id, 'id');
    if (!powerdrop) {
      return NextResponse.json({ error: 'Powerdrop not found' }, { status: 404 });
    }

    const currentCount = Number(powerdrop.participants_count) || 0;
    const maxParticipants = Number(powerdrop.max_participants) || 0;

    if (maxParticipants > 0 && currentCount >= maxParticipants) {
      return NextResponse.json({ error: 'Powerdrop is full' }, { status: 400 });
    }

    const now = Date.now();
    const startTime = Number(powerdrop.start_time) || 0;
    const duration = Number(powerdrop.duration) || 1;
    if (startTime + duration * 86400000 < now) {
      return NextResponse.json({ error: 'Powerdrop has ended' }, { status: 400 });
    }

    await query(
      `INSERT INTO powerdrop_participants (id, event_id, address, joined_at) VALUES ($1, $2, $3, $4)`,
      [crypto.randomUUID(), event_id, address, now]
    );

    await query(
      `UPDATE powerdrops SET participants_count = COALESCE(participants_count, 0) + 1 WHERE id = $1`,
      [event_id]
    );

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
