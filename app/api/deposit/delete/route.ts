import { NextRequest, NextResponse } from 'next/server';
import { query, get } from '@/lib/db';

async function requireAdmin(request: NextRequest) {
  const uid = request.headers.get('x-auth-uid');
  if (!uid) return { error: 'No uid', status: 401 as const };
  const admin = await get('admins', uid);
  if (!admin) return { error: 'Not admin', status: 403 as const };
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

    const body = await request.json();
    const { depositId, uid } = body;

    if (!depositId || !uid) {
      return NextResponse.json({ error: 'Missing depositId or uid' }, { status: 400 });
    }

    const dep = await query("SELECT amount FROM deposits WHERE id=$1 AND uid=$2", [depositId, uid]);
    if (!dep.rows.length) {
      return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });
    }

    const amt = parseFloat(dep.rows[0].amount as string) || 0;
    if (amt !== 0) {
      await query("UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) - $1 WHERE uid = $2", [amt.toFixed(2), uid]);
    }
    await query("DELETE FROM deposits WHERE id=$1", [depositId]);
    console.log(`[MANUAL DELETE] ${depositId}: reversed $${amt} from ${uid}`);
    return NextResponse.json({ success: true, deleted: depositId, reversedAmount: amt });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
