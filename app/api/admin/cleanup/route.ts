import { NextRequest, NextResponse } from 'next/server';
import { query, get } from '@/lib/db';

async function requireAdmin(request: NextRequest) {
  const uid = request.headers.get('x-auth-uid');
  if (!uid) return { error: 'No uid', status: 401 };
  const admin = await get('admins', uid);
  if (!admin) return { error: 'Not admin', status: 403 };
  return null;
}

const DEPOSIT_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const OTP_RETENTION_MS = 24 * 60 * 60 * 1000;
const NOTIF_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const AUDIT_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const authErr = await requireAdmin(request);
    if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

    const cutoffDeposit = Date.now() - DEPOSIT_RETENTION_MS;
    await query(`DELETE FROM deposits WHERE created_at < $1 AND status = 'completed'`, [cutoffDeposit]);

    const FIFTEEN_DAYS = 15 * 86400000;
    await query(
      `DELETE FROM deposit_wallets WHERE expired = true AND expired_at < $1 AND used = false`,
      [Date.now() - FIFTEEN_DAYS]
    );

    const cutoffOtp = Date.now() - OTP_RETENTION_MS;
    await query(`DELETE FROM otps WHERE created_at < $1`, [cutoffOtp]);
    await query(`DELETE FROM otp_logs WHERE created_at < $1`, [cutoffOtp]);
    await query(`DELETE FROM otp_store WHERE created_at < $1`, [cutoffOtp]);

    const cutoffNotif = Date.now() - NOTIF_RETENTION_MS;
    await query(`DELETE FROM notifications WHERE created_at < $1`, [cutoffNotif]);

    const cutoffAudit = Date.now() - AUDIT_RETENTION_MS;
    await query(`DELETE FROM audit_logs WHERE created_at < $1`, [cutoffAudit]);

    const sizeRes = await query(`SELECT pg_database_size(current_database()) AS total_bytes`);
    const totalBytes = sizeRes.rows[0]?.total_bytes || 0;
    const totalMB = (Number(totalBytes) / 1024 / 1024).toFixed(2);

    return NextResponse.json({ totalMB, success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
