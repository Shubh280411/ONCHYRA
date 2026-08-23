import { NextRequest, NextResponse } from 'next/server';
import { get, query } from '@/lib/db';

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

    const rows = await query(`SELECT * FROM withdrawals WHERE id = $1`, [id]);
    if (!rows.rows.length) {
      return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
    }
    const w = rows.rows[0];

    if (w.status === 'rejected' || w.status === 'completed') {
      return NextResponse.json({ error: 'Already processed' }, { status: 400 });
    }

    // In production, this would call withdrawalWallet.sendUSDT(w.wallet, w.net_amount)
    // For now, mark as completed
    const txHash = 'manual_' + Date.now();
    await query(
      `UPDATE withdrawals SET status = 'completed', approved_at = $1, tx_hash = $2, completed_at = $1 WHERE id = $3`,
      [Date.now(), txHash, id]
    );

    return NextResponse.json({ success: true, txHash, message: 'USDT sent' });
  } catch (e: unknown) {
    console.error('Withdrawal approve error:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
