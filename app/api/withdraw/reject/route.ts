import { NextRequest, NextResponse } from 'next/server';
import { get, increment, findWhere, update } from '@/lib/db';

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
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const w = rows[0];

    if (w.status === 'rejected' || w.status === 'completed') {
      return NextResponse.json({ error: 'Already processed' }, { status: 400 });
    }

    await update('withdrawals', id as string, {
      status: 'rejected',
      rejected_at: Date.now(),
    }, 'id');

    const wUser = await get('users', w.uid as string);
    const refundField =
      wUser && wUser.commission_balance !== undefined && wUser.commission_balance !== null
        ? 'commission_balance'
        : 'balance';
    await increment('users', w.uid as string, refundField, w.amount as number);

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error('Withdrawal reject error:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
