import { NextRequest, NextResponse } from 'next/server';
import { set, get, findWhere, incrementMulti } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

const ONX_SIGNUP = 10;
const ONX_L1 = 5;
const ONX_L2 = 3;
const ONX_L3 = 2;

export async function POST(request: NextRequest) {
  try {
    const { uid, referredBy, name, email, referralCode, country } = await request.json();
    if (!uid || !referredBy) {
      return NextResponse.json({ error: 'Missing uid or referredBy' }, { status: 400 });
    }

    await set('users', uid, {
      name: name || 'User',
      email: email || '',
      referral_code: ((referralCode as string) || '').toUpperCase(),
      referred_by: (referredBy as string).toUpperCase(),
      country: (country as string) || '',
      balance: 0,
      wallet_balance: 0,
      status: 'inactive',
      referrals: 0,
      ref_level1: 0,
      ref_level2: 0,
      ref_level3: 0,
      total_package_spend: 0,
      team_biz: 0,
      total_directs: 0,
      active_directs: 0,
      commission_balance: 0,
      onx_balance: ONX_SIGNUP,
      onx_total_received: ONX_SIGNUP,
      onx_claimed: true,
      created_at: Date.now(),
    });

    const refRows = await findWhere('users', { referral_code: (referredBy as string).toUpperCase() });
    if (!refRows.length) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
    }

    const newUserRow = await get('users', uid);
    const newUserName = newUserRow ? (newUserRow.name as string) : 'User';

    let l1Onx = 0, l2Onx = 0, l3Onx = 0;
    let l1Count = 0, l2Count = 0, l3Count = 0;

    const l1Data = refRows[0];
    const l1Uid = l1Data.uid as string;

    l1Onx = ONX_L1;
    l1Count = 1;

    await incrementMulti('users', l1Uid, {
      balance: 0.25,
      referrals: 1,
      ref_level1: 1,
      total_directs: 1,
      onx_balance: ONX_L1,
      onx_total_received: ONX_L1,
    });
    await set('commissions', 'reg_' + l1Uid + '_' + uid + '_' + Date.now(), {
      uid: l1Uid,
      from_uid: uid,
      from_name: newUserName,
      amount: 0.25,
      level: 1,
      type: 'registration_bonus',
      package_name: 'Registration Bonus',
      created_at: Date.now(),
    });

    await createNotification(l1Uid, 'ONX Referral Bonus', `You received ${ONX_L1} ONX from ${newUserName}'s signup`, 'onx');

    if (l1Data.referred_by) {
      const l2Rows = await findWhere('users', { referral_code: l1Data.referred_by as string });
      if (l2Rows.length) {
        const l2Uid = l2Rows[0].uid as string;
        l2Onx = ONX_L2;
        l2Count = 1;

        await incrementMulti('users', l2Uid, {
          balance: 0.1,
          ref_level2: 1,
          onx_balance: ONX_L2,
          onx_total_received: ONX_L2,
        });
        await set('commissions', 'reg_' + l2Uid + '_' + uid + '_' + Date.now(), {
          uid: l2Uid,
          from_uid: uid,
          from_name: newUserName,
          amount: 0.1,
          level: 2,
          type: 'registration_bonus',
          package_name: 'Registration Bonus',
          created_at: Date.now(),
        });

        await createNotification(l2Uid, 'ONX Referral Bonus', `You received ${ONX_L2} ONX from ${newUserName}'s signup (2nd level)`, 'onx');

        if (l2Rows[0].referred_by) {
          const l3Rows = await findWhere('users', { referral_code: l2Rows[0].referred_by as string });
          if (l3Rows.length) {
            const l3Uid = l3Rows[0].uid as string;
            l3Onx = ONX_L3;
            l3Count = 1;

            await incrementMulti('users', l3Uid, {
              balance: 0.05,
              ref_level3: 1,
              onx_balance: ONX_L3,
              onx_total_received: ONX_L3,
            });
            await set('commissions', 'reg_' + l3Uid + '_' + uid + '_' + Date.now(), {
              uid: l3Uid,
              from_uid: uid,
              from_name: newUserName,
              amount: 0.05,
              level: 3,
              type: 'registration_bonus',
              package_name: 'Registration Bonus',
              created_at: Date.now(),
            });

            await createNotification(l3Uid, 'ONX Referral Bonus', `You received ${ONX_L3} ONX from ${newUserName}'s signup (3rd level)`, 'onx');
          }
        }
      }
    }

    const totalOnx = ONX_SIGNUP + l1Onx + l2Onx + l3Onx;

    await set('onx_distributions', uid, {
      id: uid,
      uid,
      user_name: newUserName,
      signup_onx: ONX_SIGNUP,
      l1_count: l1Count,
      l1_onx: l1Onx,
      l2_count: l2Count,
      l2_onx: l2Onx,
      l3_count: l3Count,
      l3_onx: l3Onx,
      total_onx: totalOnx,
      created_at: Date.now(),
    }, 'id');

    const supply = await get('onx_supply', 'global', 'id');
    const distributed = Number(supply?.distributed) || 0;
    await set('onx_supply', 'global', {
      id: 'global',
      distributed: distributed + totalOnx,
      last_updated: Date.now(),
    }, 'id');

    await createNotification(uid, 'ONX Signup Bonus', `Welcome! You received ${ONX_SIGNUP} ONX tokens`, 'onx');

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
