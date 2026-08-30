import { NextRequest, NextResponse } from 'next/server';
import { all } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status');
    const withdrawals = await all('onx_withdrawals', 'created_at', 500);

    let filtered = withdrawals;
    if (status && status !== 'all') {
      filtered = withdrawals.filter((w: Record<string, unknown>) => w.status === status);
    }

    // Fetch user names
    const users = await all('users', 'created_at', 2000);
    const userMap = new Map<string, Record<string, unknown>>();
    for (const u of users) {
      userMap.set(String(u.uid), u);
    }

    const result = filtered.map((w: Record<string, unknown>) => {
      const user = userMap.get(String(w.uid));
      return {
        id: w.id,
        uid: w.uid,
        name: user?.name || 'Unknown',
        email: user?.email || '',
        address: w.address,
        amount: w.amount,
        status: w.status,
        tx_hash: w.tx_hash,
        created_at: w.created_at,
        completed_at: w.completed_at,
      };
    });

    return NextResponse.json({ withdrawals: result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
