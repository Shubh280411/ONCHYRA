import { NextRequest, NextResponse } from 'next/server';
import { get, findWhere, incrementMulti, update, remove } from '@/lib/db';

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
    const allComms = await findWhere('commissions', { type: 'package_commission' });
    const records = allComms.filter(c => Number(c.created_at) > oneHourAgo);

    let reverted = 0, errors: string[] = [];
    for (const rec of records) {
      try {
        const user = await get('users', rec.uid as string);
        if (!user) continue;

        const currentUsage = Number(user.package_usage) || 0;
        if (Number(rec.amount) > 0 && currentUsage >= Number(rec.amount)) {
          await incrementMulti('users', rec.uid as string, {
            balance: -Number(rec.amount),
            commission_balance: -Number(rec.amount),
            package_usage: -Number(rec.amount),
            total_commissions: -Number(rec.amount),
          });
          if (currentUsage - Number(rec.amount) < (Number(user.package_cap) || 999999)) {
            await update('users', rec.uid as string, { package_status: 'active' });
          }
        }
        await remove('commissions', rec.id as string, 'id');
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
