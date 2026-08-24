import { NextRequest, NextResponse } from 'next/server';
import { get, set, increment, update } from '@/lib/db';

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

    const participantId = crypto.randomUUID();
    await set('powerdrop_participants', participantId, {
      event_id,
      address,
      joined_at: now,
    });

    await update('powerdrops', event_id, {
      participants_count: currentCount + 1,
    }, 'id');

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
