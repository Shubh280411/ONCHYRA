import { NextRequest, NextResponse } from 'next/server';
import { set, findWhere, get } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const uid = request.nextUrl.searchParams.get('uid');
    const all = request.nextUrl.searchParams.get('all');

    let tickets;
    if (all === 'true') {
      tickets = await findWhere('support_tickets', { status: 'neq.deleted' }, 'updated_at', 200);
    } else if (uid) {
      tickets = await findWhere('support_tickets', { uid }, 'updated_at', 50);
    } else {
      return NextResponse.json({ error: 'uid or all required' }, { status: 400 });
    }

    const enriched = await Promise.all(tickets.map(async (t) => {
      const msgs = await findWhere('support_messages', { ticket_id: t.id as string }, 'created_at', 100);
      const lastMsg = msgs[msgs.length - 1];
      return {
        ...t,
        messageCount: msgs.length,
        lastMessage: lastMsg ? String(lastMsg.message || '').slice(0, 80) : '',
        lastMessageTime: lastMsg ? Number(lastMsg.created_at) : 0,
      };
    }));

    return NextResponse.json(enriched);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { uid, userName, userEmail, subject, category, priority, message } = await request.json();
    if (!uid || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const ticketId = 'ticket_' + uid + '_' + Date.now();
    const now = Date.now();

    await set('support_tickets', ticketId, {
      id: ticketId,
      uid,
      user_name: userName || '',
      user_email: userEmail || '',
      subject,
      category: category || 'general',
      priority: priority || 'medium',
      status: 'open',
      created_at: now,
      updated_at: now,
    }, 'id');

    const msgId = 'msg_' + ticketId + '_0';
    await set('support_messages', msgId, {
      id: msgId,
      ticket_id: ticketId,
      sender: uid,
      sender_name: userName || 'User',
      message,
      is_admin: false,
      created_at: now,
    }, 'id');

    return NextResponse.json({ success: true, ticketId });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
