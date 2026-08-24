import { NextResponse } from 'next/server';
import { findWhere } from '@/lib/db';

export async function GET() {
  try {
    const predictions = await findWhere('predictions', { status: 'active' }, 'created_at');
    return NextResponse.json({ predictions });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
