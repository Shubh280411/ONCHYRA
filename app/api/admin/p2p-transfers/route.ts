import { NextRequest, NextResponse } from 'next/server';
import { all } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let transfers: Record<string, unknown>[] = [];
    try {
      transfers = await all('p2p_transfers');
    } catch {
      transfers = [];
    }

    const sorted = transfers.sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(b.created_at || 0) - Number(a.created_at || 0));
    const paged = sorted.slice(offset, offset + limit);

    return NextResponse.json({
      total: sorted.length,
      page,
      limit,
      transfers: paged,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
