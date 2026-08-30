import { NextRequest, NextResponse } from 'next/server';
import { get, set, update, findWhere } from '@/lib/db';

const MAX_SUPPLY = 10000;
const SIGNUP_BONUS = 10;
const L1_PER = 5;
const L2_PER = 3;
const L3_PER = 2;

async function requireAdmin(request: NextRequest) {
  const uid = request.headers.get('x-auth-uid');
  if (!uid) return { error: 'No uid', status: 401 as const };
  const admin = await get('admins', uid);
  if (!admin) return { error: 'Not admin', status: 403 as const };
  return null;
}

async function calculateAllocation(user: Record<string, unknown>) {
  let l1Count = 0;
  let l2Count = 0;
  let l3Count = 0;

  const refCode = user.referral_code as string;
  if (refCode) {
    const l1Users = await findWhere('users', { referred_by: refCode });
    l1Count = l1Users.length;

    for (const l1 of l1Users) {
      const l1Ref = l1.referral_code as string;
      if (l1Ref) {
        const l2Users = await findWhere('users', { referred_by: l1Ref });
        l2Count += l2Users.length;

        for (const l2 of l2Users) {
          const l2Ref = l2.referral_code as string;
          if (l2Ref) {
            const l3Users = await findWhere('users', { referred_by: l2Ref });
            l3Count += l3Users.length;
          }
        }
      }
    }
  }

  const signupOnx = SIGNUP_BONUS;
  const l1Onx = l1Count * L1_PER;
  const l2Onx = l2Count * L2_PER;
  const l3Onx = l3Count * L3_PER;
  const total = signupOnx + l1Onx + l2Onx + l3Onx;

  return {
    signupOnx,
    l1Count,
    l1Onx,
    l2Count,
    l2Onx,
    l3Count,
    l3Onx,
    total,
  };
}

export async function POST(request: NextRequest) {
  try {
    const authErr = await requireAdmin(request);
    if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

    const supply = await get('onx_supply', 'global', 'id');
    let distributed = Number(supply?.distributed) || 0;

    const unclaimed = await findWhere('users', { onx_claimed: false });
    let processed = 0;
    let totalDistributed = 0;
    const errors: string[] = [];

    for (const user of unclaimed) {
      if (distributed >= MAX_SUPPLY) break;

      const uid = user.uid as string;
      try {
        const allocation = await calculateAllocation(user);

        if (distributed + allocation.total > MAX_SUPPLY) {
          errors.push(`${uid}: would exceed max supply`);
          continue;
        }

        const currentBalance = Number(user.onx_balance) || 0;
        const currentTotal = Number(user.onx_total_received) || 0;

        await update('users', uid, {
          onx_balance: currentBalance + allocation.total,
          onx_total_received: currentTotal + allocation.total,
          onx_claimed: true,
        });

        await set('onx_distributions', uid, {
          id: uid,
          uid,
          user_name: user.name || '',
          signup_onx: allocation.signupOnx,
          l1_count: allocation.l1Count,
          l1_onx: allocation.l1Onx,
          l2_count: allocation.l2Count,
          l2_onx: allocation.l2Onx,
          l3_count: allocation.l3Count,
          l3_onx: allocation.l3Onx,
          total_onx: allocation.total,
          created_at: Date.now(),
        }, 'id');

        distributed += allocation.total;
        totalDistributed += allocation.total;
        processed++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${uid}: ${msg}`);
      }
    }

    await set('onx_supply', 'global', {
      id: 'global',
      distributed,
      last_updated: Date.now(),
    }, 'id');

    return NextResponse.json({
      processed,
      totalDistributed,
      remaining: MAX_SUPPLY - distributed,
      errors,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
