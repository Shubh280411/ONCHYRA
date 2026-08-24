import { NextRequest, NextResponse } from 'next/server';
import { get, update, set } from '@/lib/db';
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
        const attempts = (Number(row.attempts) || 0) + 1;
        if (row.otp !== otp) {
          if (attempts >= 5) deleteOtpEntry(key);
          return { valid: false, error: 'Invalid OTP' };
        }
        update('otp_store', key, { verified: true, attempts }, 'email').catch(() => {});
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
  update('otp_store', key, { verified: true, attempts: entry.attempts }, 'email').catch(() => {});
  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();
    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const result = await verifyOtp(email, otp);
    if (result.valid) {
      return NextResponse.json({ success: true, message: 'OTP verified' });
    }
    return NextResponse.json({ error: result.error }, { status: 400 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
