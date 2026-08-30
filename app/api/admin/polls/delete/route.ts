import { NextRequest, NextResponse } from 'next/server';
import { remove } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    if (request.headers.get('x-auth-uid') !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await remove('polls', id, 'id');
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
