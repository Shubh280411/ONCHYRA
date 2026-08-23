import { NextRequest, NextResponse } from 'next/server';
import { get, update, query } from '@/lib/db';
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
  await query(
    `INSERT INTO settings (key, value) VALUES ('emailCounts', $1::jsonb) ON CONFLICT (key) DO UPDATE SET value = $1::jsonb`,
    [JSON.stringify(counts)]
  );
}

function usernameReplace(html: string, name?: string) {
  return html.replace(/\{\{\s*USERNAME\s*\}\}/gi, name || 'User');
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

    const { emails, subject, customHtml } = await request.json();

    if (!emails || !Array.isArray(emails) || !emails.length) {
      return NextResponse.json({ success: false, message: 'Provide a non-empty emails array' }, { status: 400 });
    }
    if (!subject || !customHtml) {
      return NextResponse.json({ success: false, message: 'Missing subject or customHtml' }, { status: 400 });
    }
    if (campaignState.running && !isCampaignStuck()) {
      return NextResponse.json({ success: false, message: 'A campaign is already running. Wait for it to finish.' }, { status: 429 });
    }
    if (isCampaignStuck()) {
      console.log('[RESET] Campaign stuck — force resetting');
      campaignState.running = false;
      broadcastSse({ type: 'error', message: 'Previous campaign stuck — reset' });
    }

    try {
      const { count: todayCount, limit: todayLimit } = await getDailyDoc(todayStr());
      if (todayCount >= todayLimit) {
        return NextResponse.json({ success: false, message: `Daily limit reached (${todayCount}/${todayLimit}). Try again tomorrow.` }, { status: 429 });
      }
    } catch (e: any) {
      console.log('[Manual] PG unavailable, skipping daily limit check:', e.message);
    }

    let recipients = emails.map((e: any) => {
      if (typeof e === 'string') return { email: e, name: 'User' };
      return { email: e.email, name: e.name || 'User' };
    });

    let safetyTrimmed = 0;
    if (recipients.length > MAX_EMAILS_PER_CAMPAIGN) {
      safetyTrimmed = recipients.length - MAX_EMAILS_PER_CAMPAIGN;
      recipients = recipients.slice(0, MAX_EMAILS_PER_CAMPAIGN);
    }

    campaignState.running = true;
    campaignState.logs = [];
    campaignState.sent = 0;
    campaignState.failed = 0;
    campaignState.skipped = safetyTrimmed;
    campaignState.total = recipients.length;

    // Fire-and-forget
    (async () => {
      for (let i = 0; i < recipients.length; i++) {
        const r = recipients[i];
        const html = usernameReplace(customHtml, r.name);
        try {
          await mailer.sendMail({ from: mailer.mailSettings.sender, to: r.email, subject, html });
          campaignState.sent++;
          try { await incrementDailyCount(1); } catch (e: any) { console.log('[Manual] daily count increment failed:', e.message); }
          campaignState.logs.push({ email: r.email, name: r.name, status: 'sent' });
          broadcastSse({ type: 'sent', email: r.email, name: r.name, sent: campaignState.sent, failed: campaignState.failed });
          console.log(`[SENT][MANUAL] ${r.email} — ${r.name}`);
        } catch (err: any) {
          campaignState.failed++;
          campaignState.logs.push({ email: r.email, name: r.name, status: 'failed', error: err.message });
          broadcastSse({ type: 'failed', email: r.email, name: r.name, sent: campaignState.sent, failed: campaignState.failed, error: err.message });
          console.error(`[FAILED][MANUAL] ${r.email} — ${err.message}`);
        }
        if (i < recipients.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 250));
        }
      }
      campaignState.running = false;
      broadcastSse({ type: 'done', sent: campaignState.sent, failed: campaignState.failed });
    })();

    return NextResponse.json({ success: true, message: `Manual send started for ${recipients.length} recipient(s)${safetyTrimmed > 0 ? ` (${safetyTrimmed} trimmed)` : ''}`, total: recipients.length });
  } catch (err: any) {
    campaignState.running = false;
    broadcastSse({ type: 'error', message: err.message });
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
