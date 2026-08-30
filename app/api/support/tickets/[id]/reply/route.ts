import { NextRequest, NextResponse } from 'next/server';
import { set, get } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { sender, senderName, message, isAdmin } = await request.json();
    if (!sender || !message) {
      return NextResponse.json({ error: 'Missing sender or message' }, { status: 400 });
    }

    const ticket = await get('support_tickets', id, 'id');
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const msgId = 'msg_' + id + '_' + Date.now();
    const now = Date.now();

    await set('support_messages', msgId, {
      id: msgId,
      ticket_id: id,
      sender,
      sender_name: senderName || (isAdmin ? 'Support Team' : 'User'),
      message,
      is_admin: isAdmin || false,
      created_at: now,
    }, 'id');

    await set('support_tickets', id, {
      updated_at: now,
    }, 'id');

    if (isAdmin && ticket.uid) {
      await createNotification(ticket.uid as string, 'Support Reply', `Admin replied to your ticket: ${ticket.subject}`, 'info');
    }

    return NextResponse.json({ success: true, msgId });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
