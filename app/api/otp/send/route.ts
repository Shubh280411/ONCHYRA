import { NextRequest, NextResponse } from 'next/server';
import { set, findWhere, update } from '@/lib/db';
import {
  generateOtp,
  getOtpEntry,
  setOtpEntry,
  hasCooldown,
  OTP_EXPIRY_MS,
  COOLDOWN_MS,
  type OtpEntry,
} from '@/lib/otpStore';
import transporter from '@/lib/mailer';

function getTemplate(purpose: string, otp: string): string {
  const base = `
    <div style="font-family:Arial;max-width:480px;margin:0 auto;padding:24px;background:#0b0b20;border-radius:16px;border:1px solid rgba(255,255,255,0.08);">
      <div style="text-align:center;margin-bottom:20px;">
        <img src="https://onchyra.netlify.app/logo.png" alt="ONCHYRA" style="height:40px;" />
      </div>`;

  if (purpose === 'withdrawal') {
    return base + `
      <div style="font-size:13px;color:rgba(255,255,255,0.6);text-align:center;margin-bottom:4px;">Withdrawal Verification</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.2);text-align:center;margin-bottom:24px;">Confirm your withdrawal request</div>
      <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#a78bfa;text-align:center;padding:20px;border:1px solid rgba(167,139,250,0.2);border-radius:12px;background:rgba(167,139,250,0.04);margin-bottom:20px;">${otp}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.3);text-align:center;">Use this code to verify your withdrawal request. It expires in <strong style="color:#a78bfa;">5 minutes</strong>.</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.15);text-align:center;margin-top:16px;">If you did not request a withdrawal, ignore this email.</div>
    </div>`;
  }

  return base + `
    <div style="font-size:13px;color:rgba(255,255,255,0.6);text-align:center;margin-bottom:24px;">Email Verification</div>
    <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#a78bfa;text-align:center;padding:20px;border:1px solid rgba(167,139,250,0.2);border-radius:12px;background:rgba(167,139,250,0.04);margin-bottom:20px;">${otp}</div>
    <div style="font-size:11px;color:rgba(255,255,255,0.3);text-align:center;">Use this code to verify your email. It expires in <strong style="color:#a78bfa;">5 minutes</strong>.</div>
  </div>`;
}

export async function POST(request: NextRequest) {
  try {
    const { email, purpose } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if ((email as string).includes('+')) {
      return NextResponse.json({ error: 'Email aliases (+) are not allowed' }, { status: 400 });
    }

    const key = (email as string).toLowerCase();
    const now = Date.now();

    const cd = hasCooldown(key);
    if (cd.blocked) {
      return NextResponse.json({ error: `Wait ${cd.wait}s before resending` }, { status: 429 });
    }

    const otp = generateOtp();
    const entry: OtpEntry = {
      otp,
      email: key,
      purpose: (purpose as string) || 'registration',
      createdAt: now,
      expiresAt: now + OTP_EXPIRY_MS,
      cooldownUntil: now + COOLDOWN_MS,
      verified: false,
      attempts: 0,
    };
    setOtpEntry(key, entry);

    set('otp_store', key, {
      otp,
      purpose: entry.purpose,
      created_at: now,
      expires_at: entry.expiresAt,
      cooldown_until: entry.cooldownUntil,
      verified: false,
      attempts: 0,
    }, 'email').catch((e: unknown) => console.warn('[OTP] PG upsert failed:', e instanceof Error ? e.message : String(e)));

    const subject =
      purpose === 'withdrawal'
        ? 'Withdrawal Verification - ONCHYRA'
        : 'Email Verification - ONCHYRA';

    try {
      await transporter.sendMail({
        from: transporter.mailSettings?.sender || 'ONCHYRA <noreply@onchyra.com>',
        to: email,
        subject,
        html: getTemplate(entry.purpose, otp),
      });
      return NextResponse.json({ success: true, message: 'OTP sent to your email' });
    } catch (sendErr: unknown) {
      console.error('[OTP] Send failed:', (sendErr as Error).message);
      throw sendErr;
    }
  } catch (e: unknown) {
    console.error('OTP send error:', e instanceof Error ? e.message : String(e));
    return NextResponse.json(
      { error: 'Failed to send OTP', detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
