import { NextRequest, NextResponse } from 'next/server';
import { query, get } from '@/lib/db';
import { cc } from '@/lib/utils';

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

    const rankNames = ['Ignition','Momentum','Velocity','Quantum','Fusion','Infinity','Titan','Apex','Zenith','Legacy'];
    const rows = await query(`SELECT * FROM users LIMIT 500`);
    const users = rows.rows
      .map(cc)
      .filter((u) => {
        const rec = u as Record<string, unknown>;
        const rank = rec.rank as string | undefined;
        const verified = rec.verifiedLeader as boolean | undefined;
        const status = rec.leaderStatus as string | undefined;
        return (rank && rankNames.includes(rank)) || verified || status;
      });
    return NextResponse.json(users);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
