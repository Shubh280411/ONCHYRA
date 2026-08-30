import { NextResponse } from 'next/server';
import { getPrice } from '@/lib/priceFetcher';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const price = await getPrice();
    return NextResponse.json({ price: price || 0 });
  } catch {
    return NextResponse.json({ price: 0 });
  }
}
