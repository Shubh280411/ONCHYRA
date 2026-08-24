import { NextRequest, NextResponse } from 'next/server';
import { all, get, update, set } from '@/lib/db';
import mailer from '@/lib/mailer';
import { campaignState, broadcastSse } from '@/lib/email-campaign-state';

const MAX_EMAILS_PER_CAMPAIGN = 450;
const DAILY_LIMIT = 450;

function isCampaignStuck() {
  return campaignState.running && campaignState.startedAt && Date.now() - campaignState.startedAt > 5 * 60 * 1000;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

async function getDailyDoc(dateStr: string) {
  const row = await get('settings', 'emailCounts', 'key');
  const counts: Record<string, any> = row ? (row.value || {}) : {};
  const day = counts[dateStr] || { count: 0, limit: DAILY_LIMIT };
  return { count: day.count || 0, limit: day.limit || DAILY_LIMIT };
}

async function incrementDailyCount(amount: number) {
  const { count, limit } = await getDailyDoc(todayStr());
  const row = await get('settings', 'emailCounts', 'key');
  const counts: Record<string, any> = row ? (row.value || {}) : {};
  counts[todayStr()] = { count: count + amount, limit };
  await set('settings', 'emailCounts', { value: counts }, 'key');
}

function usernameReplace(html: string, name?: string) {
  return html.replace(/\{\{\s*USERNAME\s*\}\}/gi, name || 'User');
}

function isOnCooldown(user: any) {
  if (!user.last_email_sent_at) return false;
  return Date.now() - user.last_email_sent_at < 24 * 60 * 60 * 1000;
}

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

    const { userType, subject, customHtml, skipCooldown } = await request.json();

    if (!userType || !subject || !customHtml) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    if (!['active', 'inactive', 'all'].includes(userType)) {
      return NextResponse.json({ success: false, message: 'userType must be active, inactive, or all' }, { status: 400 });
    }

    if (campaignState.running && !isCampaignStuck()) {
      return NextResponse.json({ success: false, message: 'A campaign is already running.' }, { status: 429 });
    }
    if (isCampaignStuck()) {
      campaignState.running = false;
      broadcastSse({ type: 'error', message: 'Previous campaign stuck — reset' });
    }

    const { count: todayCount, limit: todayLimit } = await getDailyDoc(todayStr());
    if (todayCount >= todayLimit) {
      return NextResponse.json({ success: false, message: `Daily limit reached (${todayCount}/${todayLimit}).` }, { status: 429 });
    }

    const users = await all('users');
    const filtered = users.filter((u: any) => {
      if (userType === 'all') return true;
      return u.status && u.status.toLowerCase() === userType.toLowerCase();
    });

    let recipients = filtered.map((u: any) => ({ email: u.email, name: u.name, uid: u.uid }));

    let cooldownSkipped = 0;
    if (!skipCooldown) {
      const out: any[] = [];
      for (const r of recipients) {
        const u = filtered.find((f: any) => f.uid === r.uid);
        if (u && isOnCooldown(u)) { cooldownSkipped++; continue; }
        out.push(r);
      }
      recipients = out;
    }

    let safetyTrimmed = 0;
    if (recipients.length > MAX_EMAILS_PER_CAMPAIGN) {
      safetyTrimmed = recipients.length - MAX_EMAILS_PER_CAMPAIGN;
      recipients = recipients.slice(0, MAX_EMAILS_PER_CAMPAIGN);
    }

    if (!recipients.length) {
      return NextResponse.json({ success: true, message: `No ${userType} users found`, sent: 0, failed: 0, skipped: cooldownSkipped });
    }

    const totalSkipped = cooldownSkipped + safetyTrimmed;
    campaignState.running = true;
    campaignState.logs = [];
    campaignState.sent = 0;
    campaignState.failed = 0;
    campaignState.skipped = totalSkipped;
    campaignState.total = recipients.length;
    campaignState.startedAt = Date.now();

    (async () => {
      for (let i = 0; i < recipients.length; i++) {
        const r = recipients[i];
        const html = usernameReplace(customHtml, r.name);
        try {
          await mailer.sendMail({ from: mailer.mailSettings.sender, to: r.email, subject, html });
          campaignState.sent++;
          await incrementDailyCount(1);
          campaignState.logs.push({ email: r.email, name: r.name, status: 'sent' });
          broadcastSse({ type: 'sent', email: r.email, name: r.name, sent: campaignState.sent, failed: campaignState.failed });
          if (r.uid) {
            update('users', r.uid, { last_email_sent_at: Date.now() }).catch(() => {});
          }
        } catch (err: any) {
          campaignState.failed++;
          campaignState.logs.push({ email: r.email, name: r.name, status: 'failed', error: err.message });
          broadcastSse({ type: 'failed', email: r.email, name: r.name, sent: campaignState.sent, failed: campaignState.failed, error: err.message });
        }
        if (i < recipients.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 250));
        }
      }
      campaignState.running = false;
      broadcastSse({ type: 'done', sent: campaignState.sent, failed: campaignState.failed, skipped: campaignState.skipped });
    })();

    return NextResponse.json({ success: true, message: `Campaign started for ${recipients.length} users` });
  } catch (err: any) {
    campaignState.running = false;
    broadcastSse({ type: 'error', message: err.message });
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
