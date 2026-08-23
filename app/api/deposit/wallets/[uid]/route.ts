import { NextRequest, NextResponse } from 'next/server';
import { findWhere } from '@/lib/db';
import { cc } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const rows = await findWhere('deposit_wallets', { uid }, 'created_at', 50);
    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        address: r.address,
        network: r.network,
        index: r.index,
        used: r.used,
        createdAt: r.created_at,
      }))
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
