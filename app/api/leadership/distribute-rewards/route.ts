import { NextRequest, NextResponse } from 'next/server';
import { get, increment, update, set, findWhere } from '@/lib/db';

async function lookupByRefCode(refCode: string) {
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

  const cap = Number(sponsor.package_cap) || Infinity;
  const usage = Number(sponsor.package_usage) || 0;
  const canAdd = Math.min(matchAmt, cap - usage);
  if (canAdd <= 0) return;

  await increment('users', sponsorUid, 'commission_balance', canAdd);
  await increment('users', sponsorUid, 'total_matching_bonus', canAdd);
  await increment('users', sponsorUid, 'package_usage', canAdd);

  await set('commissions', 'mb_' + sponsorUid + '_' + Date.now(), {
    uid: sponsorUid,
    from_uid: uid,
    amount: canAdd,
    type: 'matching_bonus',
    created_at: Date.now(),
  });
}

export async function POST(_request: NextRequest) {
  try {
    const rows = await findWhere('users', { leadership_reward_start: 'gt.0' });
    let distributed = 0;
    for (const u of rows) {
      const maxDays = Number(u.leadership_reward_days) || 0;
      const paid = Number(u.leadership_reward_payouts) || 0;
      if (paid >= maxDays) continue;
      if (!u.active_package || u.active_package === 'none' || u.package_status === 'expired') continue;

      const dailyAmt = Number(u.leadership_reward_day) || 0;
      const cap = Number(u.package_cap) || Infinity;
      const usage = Number(u.package_usage) || 0;
      const canAdd = Math.min(dailyAmt, cap - usage);
      if (canAdd <= 0) continue;

      await increment('users', u.uid as string, 'commission_balance', canAdd);
      await increment('users', u.uid as string, 'package_usage', canAdd);
      await increment('users', u.uid as string, 'leadership_reward_payouts', 1);

      await set('leadership_rewards', 'lr_' + u.uid + '_' + Date.now(), {
        uid: u.uid,
        rank: u.leadership_reward_rank,
        amount: canAdd,
        day: paid + 1,
        created_at: Date.now(),
      });

      await payMatchingBonus(u.uid as string, canAdd);
      distributed++;
    }
    return NextResponse.json({ success: true, distributed });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
