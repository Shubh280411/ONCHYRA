import { NextRequest, NextResponse } from 'next/server';
import { get, increment, update, query } from '@/lib/db';

async function lookupByRefCode(refCode: string) {
  const { findWhere } = await import('@/lib/db');
  if (!refCode) return null;
  const rows = await findWhere('users', { referral_code: refCode });
  if (!rows.length) return null;
  return { id: rows[0].uid as string, data: rows[0] };
}

async function payMatchingBonus(uid: string, rewardAmount: number) {
  const u = await get('users', uid);
  if (!u) return;
  const refCode = u.referred_by as string;
  if (!refCode) return;

  const sponsorLookup = await lookupByRefCode(refCode);
  if (!sponsorLookup) return;
  const sponsorUid = sponsorLookup.id;
  const sponsor = sponsorLookup.data;

  if (!sponsor.active_package || sponsor.package_status === 'expired') return;

  const matchAmt = rewardAmount * 0.1;
  if (matchAmt <= 0) return;

  const cap = (sponsor.package_cap as number) || Infinity;
  const usage = (sponsor.package_usage as number) || 0;
  const canAdd = Math.min(matchAmt, cap - usage);
  if (canAdd <= 0) return;

  await increment('users', sponsorUid, 'commission_balance', canAdd);
  await increment('users', sponsorUid, 'total_matching_bonus', canAdd);
  await increment('users', sponsorUid, 'package_usage', canAdd);

  await query(
    `INSERT INTO commissions (id, uid, from_uid, amount, type, created_at)
     VALUES ($1, $2, $3, $4, 'matching_bonus', $5)`,
    ['mb_' + sponsorUid + '_' + Date.now(), sponsorUid, uid, canAdd, Date.now()]
  );
}

export async function POST(_request: NextRequest) {
  try {
    const rows = await query(
      `SELECT * FROM users WHERE leadership_reward_start > 0 AND leadership_reward_start IS NOT NULL`
    );
    let distributed = 0;
    for (const u of rows.rows) {
      const maxDays = (u.leadership_reward_days as number) || 0;
      const paid = (u.leadership_reward_payouts as number) || 0;
      if (paid >= maxDays) continue;
      if (!u.active_package || u.active_package === 'none' || u.package_status === 'expired') continue;

      const dailyAmt = (u.leadership_reward_day as number) || 0;
      const cap = (u.package_cap as number) || Infinity;
      const usage = (u.package_usage as number) || 0;
      const canAdd = Math.min(dailyAmt, cap - usage);
      if (canAdd <= 0) continue;

      await increment('users', u.uid as string, 'commission_balance', canAdd);
      await increment('users', u.uid as string, 'package_usage', canAdd);
      await increment('users', u.uid as string, 'leadership_reward_payouts', 1);

      await query(
        `INSERT INTO leadership_rewards (id, uid, rank, amount, day, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['lr_' + u.uid + '_' + Date.now(), u.uid, u.leadership_reward_rank, canAdd, paid + 1, Date.now()]
      );

      await payMatchingBonus(u.uid as string, canAdd);
      distributed++;
    }
    return NextResponse.json({ success: true, distributed });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
