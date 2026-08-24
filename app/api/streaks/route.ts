import { NextRequest, NextResponse } from 'next/server';
import { findWhere } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const uid = request.nextUrl.searchParams.get('uid');
    if (!uid) {
      return NextResponse.json({ error: 'uid required' }, { status: 400 });
    }

    const claims = await findWhere('claims', { user_id: uid }, 'created_at', 30);
    return NextResponse.json({ claims });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
