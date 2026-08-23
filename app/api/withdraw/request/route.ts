import { NextRequest, NextResponse } from 'next/server';
import { get, increment, query, findWhere } from '@/lib/db';
import { getOtpEntry, deleteOtpEntry } from '@/lib/otpStore';

async function verifyOtp(email: string, otp: string): Promise<{ valid: boolean; error?: string }> {
  const key = email.toLowerCase();
  const entry = getOtpEntry(key);

  if (!entry) {
    try {
      const row = await get('otp_store', key, 'email');
      if (row) {
        if (row.verified) return { valid: false, error: 'OTP already verified' };
        if (Date.now() > (row.expires_at as number)) {
          deleteOtpEntry(key);
          return { valid: false, error: 'OTP expired. Request a new one.' };
        }
        const attempts = ((row.attempts as number) || 0) + 1;
        if (row.otp !== otp) {
          if (attempts >= 5) deleteOtpEntry(key);
          return { valid: false, error: 'Invalid OTP' };
        }
        query(`UPDATE otp_store SET verified = true, attempts = $1 WHERE email = $2`, [attempts, key]).catch(() => {});
        return { valid: true };
      }
    } catch {
      // fall through
    }
    return { valid: false, error: 'No OTP sent to this email' };
  }

  if (entry.verified) return { valid: false, error: 'OTP already verified' };
  if (Date.now() > entry.expiresAt) {
    deleteOtpEntry(key);
    return { valid: false, error: 'OTP expired. Request a new one.' };
  }

  entry.attempts++;
  if (entry.otp !== otp) {
    if (entry.attempts >= 5) deleteOtpEntry(key);
    return { valid: false, error: 'Invalid OTP' };
  }

  entry.verified = true;
  query(`UPDATE otp_store SET verified = true, attempts = $1 WHERE email = $2`, [entry.attempts, key]).catch(() => {});
  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const { uid, amount, wallet, network, otp } = await request.json();
    if (!uid || !amount || !wallet) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    if ((amount as number) < 10) {
      return NextResponse.json({ error: 'Minimum withdrawal is 10 USDT' }, { status: 400 });
    }
    if (!otp) {
      return NextResponse.json({ error: 'OTP is required' }, { status: 400 });
    }

    const user = await get('users', uid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const commBal = (user.commission_balance as number) || (user.balance as number) || 0;
    if (commBal < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const otpResult = await verifyOtp(user.email as string, otp);
    if (!otpResult.valid) {
      return NextResponse.json({ error: otpResult.error }, { status: 400 });
    }

    const fee = Math.round((amount as number) * 0.05 * 100) / 100;
    const net = Math.round(((amount as number) - fee) * 100) / 100;
    const isAuto = (amount as number) >= 10 && (amount as number) <= 50;
    const status = isAuto ? 'processing' : 'pending';

    const deductField =
      user.commission_balance !== undefined && user.commission_balance !== null
        ? 'commission_balance'
        : 'balance';
    await increment('users', uid, deductField, -amount);

    const wId = 'w_' + uid + '_' + Date.now();
    await query(
      `INSERT INTO withdrawals (id, uid, amount, fee, net_amount, wallet, network, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [wId, uid, amount, fee, net, wallet, network || 'BEP20', status, Date.now()]
    );

    const aId = 'audit_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    await query(
      `INSERT INTO audit_logs (id, type, uid, amount, fee, net, wallet, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [aId, 'withdrawal', uid, amount, fee, net, wallet, status, Date.now()]
    );

    if (isAuto) {
      // Fire-and-forget auto-withdrawal (would need withdrawalWallet service in production)
      // For now, just leave in 'processing' status
    }

    return NextResponse.json({ success: true, amount, fee, received: net, status, id: wId });
  } catch (e: unknown) {
    console.error('Withdrawal request error:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
