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
import { otpTransporter } from '@/lib/mailer';

function getTemplate(purpose: string, otp: string): string {
  const isWithdrawal = purpose === 'withdrawal';
  const title = isWithdrawal ? 'Withdrawal Verification' : 'Email Verification';
  const subtitle = isWithdrawal ? 'Confirm your withdrawal request' : 'Verify your email address';
  const desc = isWithdrawal
    ? 'Use the code below to verify your withdrawal request. This code will expire shortly.'
    : 'Use the code below to verify your email address. This code will expire shortly.';
  const noteBg = isWithdrawal ? 'rgba(239,68,68,0.08)' : 'rgba(96,165,250,0.06)';
  const noteBorder = isWithdrawal ? 'rgba(239,68,68,0.15)' : 'rgba(96,165,250,0.12)';
  const noteText = isWithdrawal
    ? 'If you did not request this withdrawal, please ignore this email and contact support immediately.'
    : 'If you did not create an account on ONCHYRA, you can safely ignore this email.';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#05060f;font-family:'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#05060f;padding:32px 16px;">
<tr><td align="center">

  <!-- Main Card -->
  <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">

    <!-- Gradient Top Bar -->
    <tr><td style="height:3px;background:linear-gradient(90deg,#a78bfa,#60a5fa,#818cf8,#a78bfa);border-radius:16px 16px 0 0;"></td></tr>

    <!-- Card Body -->
    <tr><td style="background:#0b0d1f;border:1px solid rgba(255,255,255,0.06);border-top:none;border-radius:0 0 16px 16px;padding:0;">

      <!-- Header Section -->
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:40px 40px 0;text-align:center;">

        <!-- Logo Circle -->
        <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,rgba(167,139,250,0.15),rgba(96,165,250,0.15));border:1px solid rgba(167,139,250,0.2);display:inline-block;text-align:center;line-height:64px;margin-bottom:20px;">
          <img src="https://onchyra.online/logo-64.png" alt="" width="40" height="40" style="border-radius:10px;vertical-align:middle;" />
        </div>

        <!-- Title -->
        <div style="font-size:24px;font-weight:800;color:#ffffff;margin-bottom:6px;letter-spacing:-0.3px;">${title}</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);margin-bottom:0;">${subtitle}</div>

      </td></tr></table>

      <!-- Divider -->
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:28px 40px 0;">
        <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(167,139,250,0.2),transparent);"></div>
      </td></tr></table>

      <!-- OTP Code Section -->
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:28px 40px 0;text-align:center;">
        <div style="background:#0f1129;border:1px solid rgba(167,139,250,0.15);border-radius:14px;padding:28px 20px;position:relative;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.25);margin-bottom:12px;">Your verification code</div>
          <div style="font-size:48px;font-weight:900;letter-spacing:14px;color:#a78bfa;font-family:'Courier New',Consolas,monospace;line-height:1;">${otp}</div>
        </div>
      </td></tr></table>

      <!-- Description -->
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:24px 40px 0;text-align:center;">
        <div style="font-size:13px;color:rgba(255,255,255,0.45);line-height:1.7;">${desc}</div>
      </td></tr></table>

      <!-- Timer Badge -->
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:16px 40px 0;text-align:center;">
        <div style="display:inline-block;background:rgba(167,139,250,0.08);border:1px solid rgba(167,139,250,0.12);border-radius:100px;padding:8px 20px;">
          <span style="font-size:12px;color:rgba(255,255,255,0.4);">Expires in </span><span style="font-size:12px;color:#a78bfa;font-weight:700;">5 minutes</span>
        </div>
      </td></tr></table>

      <!-- Note -->
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:24px 40px 0;">
        <div style="background:${noteBg};border:1px solid ${noteBorder};border-radius:10px;padding:16px 20px;">
          <div style="font-size:12px;color:rgba(255,255,255,0.4);line-height:1.6;text-align:center;">${noteText}</div>
        </div>
      </td></tr></table>

      <!-- Divider -->
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:28px 40px 0;">
        <div style="height:1px;background:rgba(255,255,255,0.04);"></div>
      </td></tr></table>

      <!-- Footer -->
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:20px 40px 32px;text-align:center;">
        <div style="margin-bottom:8px;">
          <img src="https://onchyra.online/logo-64.png" alt="" width="20" height="20" style="border-radius:5px;vertical-align:middle;opacity:0.4;" />
        </div>
        <div style="font-size:11px;color:rgba(255,255,255,0.2);line-height:1.6;">
          This is an automated message from ONCHYRA.<br/>Do not reply to this email.
        </div>
        <div style="font-size:10px;color:rgba(255,255,255,0.12);margin-top:8px;">
          &copy; 2026 ONCHYRA. All rights reserved.
        </div>
      </td></tr></table>

    </td></tr>

  </table>

</td></tr>
</table>

</body>
</html>`;
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
      console.log('[OTP] SMTP settings:', {
        host: otpTransporter.mailSettings?.host,
        port: otpTransporter.mailSettings?.port,
        secure: otpTransporter.mailSettings?.secure,
        user: otpTransporter.mailSettings?.auth?.user,
        sender: otpTransporter.mailSettings?.sender,
        senderEmail: otpTransporter.mailSettings?.senderEmail,
      });
      const info = await otpTransporter.sendMail({
        from: otpTransporter.mailSettings?.sender || 'ONCHYRA Verify <info@onchyra.online>',
        to: email,
        subject,
        html: getTemplate(entry.purpose, otp),
      });
      console.log('[OTP] Send success:', info.messageId, info.response);
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
