import { NextRequest, NextResponse } from 'next/server';
import { get, findWhere, update, remove } from '@/lib/db';

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

    const deps = await findWhere('deposits', { id: depositId, uid });
    if (!deps.length) {
      return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });
    }

    const amt = parseFloat(String(deps[0].amount)) || 0;
    if (amt !== 0) {
      const user = await get('users', uid);
      if (user) {
        await update('users', uid, {
          wallet_balance: (Number(user.wallet_balance) || 0) - amt,
        });
      }
    }
    await remove('deposits', depositId, 'id');
    console.log(`[MANUAL DELETE] ${depositId}: reversed $${amt} from ${uid}`);
    return NextResponse.json({ success: true, deleted: depositId, reversedAmount: amt });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
