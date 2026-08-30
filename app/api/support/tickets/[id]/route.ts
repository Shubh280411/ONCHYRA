import { NextRequest, NextResponse } from 'next/server';
import { get, findWhere } from '@/lib/db';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ticket = await get('support_tickets', id, 'id');
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const messages = await findWhere('support_messages', { ticket_id: id }, 'created_at', 500);

    return NextResponse.json({ ticket, messages });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
