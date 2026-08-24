import { NextRequest, NextResponse } from 'next/server';
import { set, get, findWhere, incrementMulti } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { uid, referredBy, name, email, referralCode } = await request.json();
    if (!uid || !referredBy) {
      return NextResponse.json({ error: 'Missing uid or referredBy' }, { status: 400 });
    }

    await set('users', uid, {
      name: name || 'User',
      email: email || '',
      referral_code: ((referralCode as string) || '').toUpperCase(),
      referred_by: (referredBy as string).toUpperCase(),
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
      created_at: Date.now(),
    });

    const refRows = await findWhere('users', { referral_code: (referredBy as string).toUpperCase() });
    if (!refRows.length) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
    }

    const newUserRow = await get('users', uid);
    const newUserName = newUserRow ? (newUserRow.name as string) : 'User';

    const l1Data = refRows[0];
    const l1Uid = l1Data.uid as string;

    await incrementMulti('users', l1Uid, {
      balance: 0.25,
      referrals: 1,
      ref_level1: 1,
      total_directs: 1,
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

    if (l1Data.referred_by) {
      const l2Rows = await findWhere('users', { referral_code: l1Data.referred_by as string });
      if (l2Rows.length) {
        const l2Uid = l2Rows[0].uid as string;
        await incrementMulti('users', l2Uid, { balance: 0.1, ref_level2: 1 });
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

        if (l2Rows[0].referred_by) {
          const l3Rows = await findWhere('users', { referral_code: l2Rows[0].referred_by as string });
          if (l3Rows.length) {
            const l3Uid = l3Rows[0].uid as string;
            await incrementMulti('users', l3Uid, { balance: 0.05, ref_level3: 1 });
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
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
