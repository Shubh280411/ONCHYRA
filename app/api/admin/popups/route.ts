import { NextRequest, NextResponse } from 'next/server';
import { findWhere, set, get, remove } from '@/lib/db';

export async function GET() {
  try {
    const popups = await findWhere('notifications', { type: 'popup' });
    popups.sort((a, b) => (b.created_at as number) - (a.created_at as number));
    return NextResponse.json({ popups });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, message, color, active, id: editId } = await request.json();
    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message required' }, { status: 400 });
    }

    if (editId) {
      const existing = await get('notifications', editId);
      if (!existing) return NextResponse.json({ error: 'Popup not found' }, { status: 404 });
      await set('notifications', editId, {
        ...existing,
        title,
        message,
        color: color || '#a78bfa',
        active: active !== false,
        updated_at: Date.now(),
      });
      return NextResponse.json({ success: true, id: editId });
    }

    const popupId = 'popup_' + Date.now();
    await set('notifications', popupId, {
      user_id: 'all',
      title,
      message,
      type: 'popup',
      color: color || '#a78bfa',
      active: active !== false,
      readBy: [],
      created_at: Date.now(),
    });
    return NextResponse.json({ success: true, id: popupId });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await remove('notifications', id, 'id');
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
