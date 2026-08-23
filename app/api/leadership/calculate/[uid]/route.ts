import { NextRequest, NextResponse } from 'next/server';
import { get, findWhere, increment, update, query } from '@/lib/db';

const RANKS = [
  { name: 'Ignition', reqDirect: 3, reqTeam: 1000, reqLeg: 500, bonus: 25, rewardDay: 5, rewardDays: 5 },
  { name: 'Momentum', reqDirect: 5, reqTeam: 5000, reqLeg: 2500, bonus: 100, rewardDay: 10, rewardDays: 10 },
  { name: 'Velocity', reqDirect: 7, reqTeam: 10000, reqLeg: 5000, bonus: 250, rewardDay: 20, rewardDays: 15 },
  { name: 'Quantum', reqDirect: 10, reqTeam: 25000, reqLeg: 12500, bonus: 500, rewardDay: 40, rewardDays: 20 },
  { name: 'Fusion', reqDirect: 12, reqTeam: 50000, reqLeg: 25000, bonus: 1000, rewardDay: 75, rewardDays: 25 },
  { name: 'Infinity', reqDirect: 15, reqTeam: 100000, reqLeg: 50000, bonus: 2500, rewardDay: 150, rewardDays: 30 },
  { name: 'Titan', reqDirect: 20, reqTeam: 250000, reqLeg: 125000, bonus: 5000, rewardDay: 300, rewardDays: 30 },
  { name: 'Apex', reqDirect: 25, reqTeam: 500000, reqLeg: 250000, bonus: 10000, rewardDay: 600, rewardDays: 30 },
  { name: 'Zenith', reqDirect: 30, reqTeam: 1000000, reqLeg: 500000, bonus: 25000, rewardDay: 1250, rewardDays: 30 },
  { name: 'Legacy', reqDirect: 40, reqTeam: 2500000, reqLeg: 1250000, bonus: 50000, rewardDay: 3000, rewardDays: 30 },
];

const RANK_INDEX: Record<string, number> = RANKS.reduce(
  (m, r, i) => {
    m[r.name] = i;
    return m;
  },
  {} as Record<string, number>
);

async function getDownlineVolume(refCode: string, depth = 0, maxDepth = 10): Promise<number> {
  if (depth >= maxDepth || !refCode) return 0;
  const rows = await findWhere('users', { referred_by: refCode });
  let vol = 0;
  for (const u of rows) {
    vol += (u.total_package_spend as number) || 0;
    vol += await getDownlineVolume(u.referral_code as string, depth + 1, maxDepth);
  }
  return vol;
}

async function getLegsVolume(refCode: string): Promise<number[]> {
  if (!refCode) return [];
  const rows = await findWhere('users', { referred_by: refCode });
  const legs: number[] = [];
  for (const u of rows) {
    const subVol = await getDownlineVolume(u.referral_code as string);
    legs.push(((u.total_package_spend as number) || 0) + subVol);
  }
  legs.sort((a, b) => b - a);
  return legs;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const user = await get('users', uid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.active_package || user.active_package === 'none' || user.package_status === 'expired') {
      return NextResponse.json({ rank: 'Unranked', reason: 'No active package' });
    }

    const refCode = user.referral_code as string;
    const directRows = refCode ? await findWhere('users', { referred_by: refCode }) : [];
    const directCount = directRows.length;
    const legs = await getLegsVolume(refCode);
    const totalTeamVolume = legs.reduce((a, b) => a + b, 0);
    const topLeg = legs[0] || 0;
    const otherLegs = totalTeamVolume - topLeg;
    const weakLeg = Math.min(topLeg, otherLegs);

    let newRank = 'Unranked';
    let newRankIdx = -1;
    for (let i = RANKS.length - 1; i >= 0; i--) {
      const r = RANKS[i];
      if (directCount >= r.reqDirect && totalTeamVolume >= r.reqTeam && weakLeg >= r.reqLeg) {
        newRank = r.name;
        newRankIdx = i;
        break;
      }
    }

    const currentRank = (user.rank as string) || 'Unranked';
    const currentIdx = RANK_INDEX[currentRank] !== undefined ? RANK_INDEX[currentRank] : -1;
    let rankAchieved = currentRank;
    let newAchievement = false;

    if (newRankIdx > currentIdx) {
      rankAchieved = newRank;
      newAchievement = true;
    } else if (newRankIdx >= 0 && newRankIdx === currentIdx) {
      rankAchieved = newRank;
    }

    const updates: Record<string, unknown> = { rank: rankAchieved, rank_calculated_at: Date.now() };

    if (newRankIdx >= 0 && !user.achievement_bonus_claimed) {
      const r = RANKS[newRankIdx];
      if (r && r.bonus > 0) {
        await increment('users', uid, 'commission_balance', r.bonus);
        await update('users', uid, { achievement_bonus_claimed: true });
        await query(
          `INSERT INTO achievement_bonuses (id, uid, rank, amount, type, created_at)
           VALUES ($1, $2, $3, $4, 'achievement', $5)`,
          ['ab_' + uid + '_' + Date.now(), uid, rankAchieved, r.bonus, Date.now()]
        );
      }
    }

    if (newAchievement || (newRankIdx >= 0 && !user.leadership_reward_rank)) {
      const r = RANKS[newRankIdx];
      updates.leadership_reward_rank = rankAchieved;
      updates.leadership_reward_day = r.rewardDay;
      updates.leadership_reward_days = r.rewardDays;
      updates.leadership_reward_payouts = 0;
      updates.leadership_reward_start = Date.now();
    }

    await update('users', uid, updates);

    return NextResponse.json({
      rank: rankAchieved,
      directCount,
      totalTeamVolume,
      weakLeg,
      topLeg,
      otherLegs,
      legs: legs.slice(0, 5),
      newAchievement,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
