import { NextResponse } from 'next/server';
import { all } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const wallets = await all('deposit_wallets', 'created_at', 500);
    return NextResponse.json({ wallets });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
