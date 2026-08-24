import { NextRequest, NextResponse } from 'next/server';
import { get, findWhere, update } from '@/lib/db';

async function requireAdmin(request: NextRequest) {
  const uid = request.headers.get('x-auth-uid');
  if (!uid) return { error: 'No uid', status: 401 };
  const admin = await get('admins', uid);
  if (!admin) return { error: 'Not admin', status: 403 };
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing withdrawal ID' }, { status: 400 });
    }

    const rows = await findWhere('withdrawals', { id }, null, 1);
    if (!rows.length) {
      return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
    }
    const w = rows[0];

    if (w.status === 'rejected' || w.status === 'completed') {
      return NextResponse.json({ error: 'Already processed' }, { status: 400 });
    }

    const txHash = 'manual_' + Date.now();
    await update('withdrawals', id as string, {
      status: 'completed',
      approved_at: Date.now(),
      tx_hash: txHash,
      completed_at: Date.now(),
    }, 'id');

    return NextResponse.json({ success: true, txHash, message: 'USDT sent' });
  } catch (e: unknown) {
    console.error('Withdrawal approve error:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
