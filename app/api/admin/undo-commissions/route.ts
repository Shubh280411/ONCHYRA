import { NextRequest, NextResponse } from 'next/server';
import { query, get, incrementMulti } from '@/lib/db';

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

    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const commRes = await query(
      `SELECT * FROM commissions WHERE type = 'package_commission' AND created_at > $1`, [oneHourAgo]
    );
    const records = commRes.rows;

    let reverted = 0, errors: string[] = [];
    for (const rec of records) {
      try {
        const user = await get('users', rec.uid as string);
        if (!user) continue;

        const currentUsage = (user.package_usage as number) || 0;
        if ((rec.amount as number) > 0 && currentUsage >= (rec.amount as number)) {
          await incrementMulti('users', rec.uid as string, {
            balance: -(rec.amount as number),
            commission_balance: -(rec.amount as number),
            package_usage: -(rec.amount as number),
            total_commissions: -(rec.amount as number),
          });
          if (currentUsage - (rec.amount as number) < ((user.package_cap as number) || 999999)) {
            await query(`UPDATE users SET package_status = 'active' WHERE uid = $1`, [rec.uid]);
          }
        }
        await query(`DELETE FROM commissions WHERE id = $1`, [rec.id]);
        reverted++;
      } catch(e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`${rec.id}: ${msg}`);
      }
    }

    return NextResponse.json({ success: true, reverted, errors: errors.length, errorDetails: errors.slice(0, 10) });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
