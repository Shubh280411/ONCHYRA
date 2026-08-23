import { NextRequest, NextResponse } from 'next/server';
import { get } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const uid = request.headers.get('x-auth-uid');
    if (!uid) return NextResponse.json({ error: 'No uid' }, { status: 401 });
    const admin = await get('admins', uid);
    if (!admin) return NextResponse.json({ error: 'Not admin' }, { status: 403 });
    return NextResponse.json({ admin: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
