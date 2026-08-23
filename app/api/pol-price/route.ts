import { NextResponse } from 'next/server';
import { getPriceCached } from '@/lib/priceFetcher';

export async function GET() {
  try {
    const data = await getPriceCached();
    return NextResponse.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
