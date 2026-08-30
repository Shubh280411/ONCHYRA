import { NextRequest, NextResponse } from 'next/server';
import { findWhere, set } from '@/lib/db';

export async function GET() {
  try {
    const all = await findWhere('notifications', { type: 'announcement' }, 'created_at', 100);
    const parsed = all.map((a: Record<string, unknown>) => {
      let image = '';
      let category = 'general';
      try {
        const meta = JSON.parse((a.link_title as string) || '{}');
        image = meta.image || '';
        category = meta.category || 'general';
      } catch {}
      return { ...a, image, category };
    });
    return NextResponse.json({ announcements: parsed });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message, image, category } = body;
    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message required' }, { status: 400 });
    }
    const id = `ann_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const meta = JSON.stringify({ image: image || '', category: category || 'general' });
    await set('notifications', id, {
      id,
      user_id: 'all',
      type: 'announcement',
      title,
      message,
      link: '',
      link_title: meta,
      read_by: {},
      created_at: Date.now(),
      delete_at: null,
    }, 'id');
    return NextResponse.json({ success: true, id });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
