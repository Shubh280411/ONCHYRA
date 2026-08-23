import { NextRequest, NextResponse } from 'next/server';
import { get, set } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { uid, name, email, referralCode, referredBy } = await request.json();
    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    const existing = await get('users', uid);
    if (existing) {
      return NextResponse.json({ synced: false, reason: 'already_exists' });
    }

    await set('users', uid, {
      name: name || 'User',
      email: email || '',
      referral_code: ((referralCode as string) || '').toUpperCase(),
      referred_by: ((referredBy as string) || '').toUpperCase(),
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

    return NextResponse.json({ synced: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
