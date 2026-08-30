import { NextRequest, NextResponse } from 'next/server';
import { all } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';

    const users = await all('users', 'created_at', 5000);
    const now = Date.now();
    const h24 = 24 * 60 * 60 * 1000;

    let filtered = users;
    if (filter === 'active') {
      filtered = users.filter((u: Record<string, unknown>) => {
        const lc = Number(u.last_claim) || 0;
        const ls = Number(u.last_streak_claim) || 0;
        return lc > now - h24 || ls > now - h24;
      });
    } else if (filter === 'inactive') {
      filtered = users.filter((u: Record<string, unknown>) => {
        const lc = Number(u.last_claim) || 0;
        const ls = Number(u.last_streak_claim) || 0;
        return lc <= now - h24 && ls <= now - h24;
      });
    }

    const emails = filtered
      .map((u: Record<string, unknown>) => ({
        email: u.email || '',
        name: u.name || 'Unknown',
        uid: u.uid,
        created_at: Number(u.created_at) || 0,
        last_claim: Number(u.last_claim) || 0,
        balance: Number(u.balance) || 0,
        package_status: u.package_status || 'none',
      }))
      .filter(e => e.email)
      .sort((a, b) => b.created_at - a.created_at);

    return NextResponse.json({
      total: emails.length,
      filter,
      emails,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
