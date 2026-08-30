import { NextRequest, NextResponse } from 'next/server';
import { findWhere } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    const transfers = await findWhere('p2p_transfers', { from_uid: uid });
    const received = await findWhere('p2p_transfers', { to_uid: uid });

    const all = [...transfers, ...received]
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(b.created_at) - Number(a.created_at))
      .slice(0, 50);

    return NextResponse.json({ transfers: all });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
