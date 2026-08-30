import { NextResponse } from 'next/server';
import { get } from '@/lib/db';

export async function GET() {
  try {
    const supply = await get('onx_supply', 'global', 'id');
    const distributed = Number(supply?.distributed) || 0;

    return NextResponse.json({
      maxSupply: 10000,
      publicAlloc: 8000,
      teamAlloc: 500,
      marketingAlloc: 500,
      liquidityAlloc: 1000,
      distributed,
      remaining: 10000 - distributed,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
