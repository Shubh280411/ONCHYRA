import { NextRequest, NextResponse } from 'next/server';
import { get } from '@/lib/db';

const DAILY_LIMIT = 450;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

async function getDailyDoc(dateStr: string) {
  const row = await get('settings', 'emailCounts', 'key');
  const counts: Record<string, any> = row ? (row.value || {}) : {};
  const day = counts[dateStr] || { count: 0, limit: DAILY_LIMIT };
  return { count: day.count || 0, limit: day.limit || DAILY_LIMIT };
}

async function requireAdmin(request: NextRequest) {
  const uid = request.headers.get('x-auth-uid');
  if (!uid) return { error: 'No uid', status: 401 };
  const admin = await get('admins', uid);
  if (!admin) return { error: 'Not admin', status: 403 };
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const authErr = await requireAdmin(request);
    if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

    let today = { count: 0, limit: DAILY_LIMIT };
    try { today = await getDailyDoc(todayStr()); } catch (e: any) { console.log('[Stats] PG unavailable:', e.message); }

    const history: { date: string; count: number; limit: number }[] = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      try {
        const day = await getDailyDoc(ds);
        history.push({ date: ds, count: day.count, limit: day.limit });
      } catch (e) {
        history.push({ date: ds, count: 0, limit: DAILY_LIMIT });
      }
    }

    return NextResponse.json({
      today: { date: todayStr(), count: today.count, limit: today.limit, remaining: today.limit - today.count },
      history,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
