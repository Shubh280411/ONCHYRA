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
    const { uid, address, amount, network, token, polAmount, polPrice, usdAmount, fixDepositId } = body;

    if (!uid || !address || !network) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const ts = Date.now();
    const polAmt = Number(polAmount) || 0;
    const usdAmt = Number(usdAmount) || Number(amount) || 0;
    const pPrice = Number(polPrice) || 0;
    const tok = token || (network === 'Polygon' ? 'POL' : 'USDT');

    if (fixDepositId) {
      const old = await query("SELECT amount FROM deposits WHERE id=$1", [fixDepositId]);
      if (!old.rows.length) {
        return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });
      }
      const oldAmt = parseFloat(old.rows[0].amount as string) || 0;
      await query("UPDATE deposits SET amount=$1, pol_price=$2 WHERE id=$3", [usdAmt.toFixed(2), pPrice, fixDepositId]);
      const diff = usdAmt - oldAmt;
      if (diff !== 0) {
        await query("UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE uid = $2", [diff.toFixed(2), uid]);
      }
      console.log(`[MANUAL FIX] ${fixDepositId}: $${oldAmt} → $${usdAmt}, balance adj: ${diff.toFixed(2)}`);
      return NextResponse.json({ success: true, fixed: fixDepositId, oldAmount: oldAmt, newAmount: usdAmt, balanceAdjustment: diff });
    }

    const depId = 'dep_manual_' + uid.slice(0, 8) + '_' + ts;
    const tx = 'manual_' + ts;
    await query(
      `INSERT INTO deposits (id, uid, address, network, amount, tx_hash, status, token, pol_amount, pol_price, detected_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'completed', $7, $8, $9, $10, $10)`,
      [depId, uid, address, network, usdAmt.toFixed(2), tx, tok, polAmt, pPrice, ts]
    );
    await query(
      `UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE uid = $2`,
      [usdAmt.toFixed(2), uid]
    );
    console.log(`[MANUAL DEPOSIT] ${polAmt || usdAmt} ${tok} for ${uid}`);
    return NextResponse.json({ success: true, depositId: depId });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
