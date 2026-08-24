import { NextRequest, NextResponse } from 'next/server';
import { get, all, remove } from '@/lib/db';

async function requireAdmin(request: NextRequest) {
  const uid = request.headers.get('x-auth-uid');
  if (!uid) return { error: 'No uid', status: 401 };
  const admin = await get('admins', uid);
  if (!admin) return { error: 'Not admin', status: 403 };
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const authErr = await requireAdmin(request);
    if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

    const cutoffDeposit = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const deposits = await all('deposits');
    const oldDeposits = deposits.filter(d => d.status === 'completed' && Number(d.created_at) < cutoffDeposit);
    for (const d of oldDeposits) {
      await remove('deposits', d.id as string, 'id');
    }

    const cutoffOtp = Date.now() - 24 * 60 * 60 * 1000;
    const otps = await all('otp_store');
    for (const o of otps) {
      if (Number(o.created_at) < cutoffOtp) {
        await remove('otp_store', o.email as string, 'email');
      }
    }

    const cutoffNotif = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const notis = await all('notifications');
    for (const n of notis) {
      if (Number(n.created_at) < cutoffNotif) {
        await remove('notifications', n.id as string, 'id');
      }
    }

    return NextResponse.json({ success: true, deletedDeposits: oldDeposits.length });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
