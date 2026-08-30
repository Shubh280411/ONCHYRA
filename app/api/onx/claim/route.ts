import { NextRequest, NextResponse } from 'next/server';
import { get, set, update, findWhere } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

const MAX_SUPPLY = 10000;
const SIGNUP_BONUS = 10;
const L1_PER = 5;
const L2_PER = 3;
const L3_PER = 2;

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
    const { uid } = await request.json();
    if (!uid) {
      return NextResponse.json({ error: 'uid required' }, { status: 400 });
    }

    const user = await get('users', uid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.onx_claimed === true) {
      return NextResponse.json({ error: 'Already claimed' }, { status: 400 });
    }

    const supply = await get('onx_supply', 'global', 'id');
    const distributed = Number(supply?.distributed) || 0;
    if (distributed >= MAX_SUPPLY) {
      return NextResponse.json({ error: 'Max supply reached' }, { status: 400 });
    }

    const allocation = await calculateAllocation(user);

    if (distributed + allocation.total > MAX_SUPPLY) {
      return NextResponse.json({ error: 'Claim would exceed max supply' }, { status: 400 });
    }

    const currentBalance = Number(user.onx_balance) || 0;
    const currentTotal = Number(user.onx_total_received) || 0;
    const newBalance = currentBalance + allocation.total;
    const newTotal = currentTotal + allocation.total;

    await update('users', uid, {
      onx_balance: newBalance,
      onx_total_received: newTotal,
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

    const newDistributed = distributed + allocation.total;
    await set('onx_supply', 'global', {
      id: 'global',
      distributed: newDistributed,
      last_updated: Date.now(),
    }, 'id');

    await createNotification(uid, 'ONX Airdrop Received', `You received ${allocation.total} ONX tokens`, 'onx');

    return NextResponse.json({
      success: true,
      allocation: {
        signup: allocation.signupOnx,
        l1: allocation.l1Onx,
        l2: allocation.l2Onx,
        l3: allocation.l3Onx,
        total: allocation.total,
      },
      newBalance,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
