import { NextRequest, NextResponse } from 'next/server';
import { query, update, get } from '@/lib/db';

async function requireAdmin(request: NextRequest) {
  const uid = request.headers.get('x-auth-uid');
  if (!uid) return { error: 'No uid', status: 401 };
  const admin = await get('admins', uid);
  if (!admin) return { error: 'Not admin', status: 403 };
  return null;
}

const DEFAULT_SUBJECT = 'Hey {{NAME}}, Your Mining Rewards Are Waiting!';
const DEFAULT_HTML_LINES = [
  '<div style="font-family:Arial;max-width:520px;margin:0 auto;padding:32px;background:#0b0b20;border-radius:16px;border:1px solid rgba(255,255,255,0.08);">',
  '  <div style="text-align:center;margin-bottom:24px;">',
  '    <img src="https://onchyra.netlify.app/logo.png" alt="ONCHYRA" style="height:40px;" />',
  '    <div style="font-size:11px;color:rgba(255,255,255,0.25);margin-top:4px;">Decentralised Mining Platform</div>',
  '  </div>',
  '  <div style="font-size:22px;font-weight:700;color:#a78bfa;text-align:center;margin-bottom:20px;">Hey {{NAME}}!</div>',
  '  <div style="background:rgba(167,139,250,0.06);border:1px solid rgba(167,139,250,0.15);border-radius:12px;padding:20px;margin-bottom:20px;text-align:center;">',
  '    <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:6px;">Your Daily Mining Reward</div>',
  '    <div style="font-size:28px;font-weight:900;color:#22c55e;letter-spacing:1px;">IS WAITING</div>',
  '  </div>',
  '  <p style="font-size:13px;color:rgba(255,255,255,0.55);line-height:1.7;text-align:center;margin:0 0 20px;">',
  '    You haven\'t mined in a while. Log in now to claim your daily mining and build your streak.',
  '  </p>',
  '  <div style="text-align:center;margin-bottom:24px;">',
  '    <a href="https://onchyra.netlify.app/dashboard" style="display:inline-block;background:#a78bfa;color:#000;font-weight:700;font-size:14px;padding:12px 36px;border-radius:8px;text-decoration:none;">Start Mining Now</a>',
  '  </div>',
  '  <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:20px 0;">',
  '  <p style="font-size:10px;color:rgba(255,255,255,0.2);text-align:center;margin:0;">',
  '    ONCHYRA &bull; <a href="https://onchyra.netlify.app" style="color:rgba(167,139,250,0.6);text-decoration:none;">onchyra.com</a>',
  '  </p>',
  '</div>',
].join('\n');

export async function POST(request: NextRequest) {
  try {
    const authErr = await requireAdmin(request);
    if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

    const { subject: customSubject, html: customHtml } = await request.json();
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const result = await query(
      "SELECT uid, email, name FROM users WHERE (last_claim IS NULL OR last_claim < $1) AND email IS NOT NULL AND email != ''",
      [threeDaysAgo]
    );
    const users = result.rows;
    if (!users.length) return NextResponse.json({ success: true, sent: 0, failed: 0, total: 0, message: 'No inactive users found' });

    const subject = customSubject || DEFAULT_SUBJECT;
    const htmlTemplate = customHtml || DEFAULT_HTML_LINES;

    let sent = 0, failed = 0;
    for (const u of users) {
      try {
        const html = htmlTemplate.replace(/\{\{NAME\}\}/g, (u.name as string) || 'Miner');
        const subj = subject.replace(/\{\{NAME\}\}/g, (u.name as string) || 'Miner');
        console.log(`[EMAIL-INACTIVE] Would send to ${u.email}: ${subj}`);
        sent++;
        update('users', u.uid as string, { last_email_sent_at: Date.now() }).catch(() => {});
      } catch (err: unknown) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[EMAIL-INACTIVE] Failed: ${u.email} - ${msg}`);
      }
      if (sent + failed < users.length) {
        await new Promise(r => setTimeout(r, 250));
      }
    }
    return NextResponse.json({ success: true, sent, failed, total: users.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
