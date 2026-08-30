import { NextResponse } from 'next/server';
import { all, findWhere } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = Date.now();
    const h24 = 24 * 60 * 60 * 1000;

    const allUsers = await all('users', 'created_at', 2000);
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter((u: Record<string, unknown>) => {
      const lc = Number(u.last_claim) || 0;
      return lc > now - h24;
    }).length;
    const inactiveUsers = totalUsers - activeUsers;

    const totalBalance = allUsers.reduce((s: number, u: Record<string, unknown>) => s + (Number(u.balance) || 0), 0);
    const totalClaimed = allUsers.reduce((s: number, u: Record<string, unknown>) => s + (Number(u.total_claimed) || 0), 0);
    const totalPackageSpend = allUsers.reduce((s: number, u: Record<string, unknown>) => s + (Number(u.total_package_spend) || 0), 0);

    const withPackage = allUsers.filter((u: Record<string, unknown>) => u.package_status === 'active').length;

    const topDirects = allUsers
      .map((u: Record<string, unknown>) => ({
        uid: u.uid,
        name: u.name || 'Unknown',
        email: u.email || '',
        referral_code: u.referral_code || '',
        direct_count: Number(u.ref_level1) || 0,
        team_volume: Number(u.total_team_volume) || 0,
      }))
      .sort((a, b) => b.direct_count - a.direct_count)
      .slice(0, 10);

    const topTeam = allUsers
      .map((u: Record<string, unknown>) => ({
        uid: u.uid,
        name: u.name || 'Unknown',
        email: u.email || '',
        referral_code: u.referral_code || '',
        direct_count: Number(u.ref_level1) || 0,
        team_volume: Number(u.total_team_volume) || 0,
      }))
      .sort((a, b) => b.team_volume - a.team_volume)
      .slice(0, 10);

    let claims: Record<string, unknown>[] = [];
    try {
      claims = await all('claims', 'created_at', 500);
    } catch {
      claims = [];
    }

    // Filter out claims with 0 amount (old bad data) and use only valid ones
    const validClaims = claims.filter((c: Record<string, unknown>) => Number(c.amount) > 0);

    // Also build recent claims from users table using last_claim (fallback for old data)
    const userClaims = allUsers
      .filter((u: Record<string, unknown>) => Number(u.last_claim) > 0)
      .map((u: Record<string, unknown>) => {
        const packageBoost = Number(u.package_boost || u.packageboost) || 1;
        return {
          user_id: String(u.uid || ''),
          name: String(u.name || 'Unknown'),
          amount: parseFloat((0.05 * packageBoost).toFixed(4)),
          created_at: Number(u.last_claim) || 0,
        };
      });

    // Merge: valid claims from table + user-based claims, dedupe by user_id (keep latest)
    const claimMap = new Map<string, { user_id: string; name: string; amount: number; created_at: number }>();
    for (const c of userClaims) {
      claimMap.set(c.user_id, c);
    }
    for (const c of validClaims) {
      const user = allUsers.find((u: Record<string, unknown>) => u.uid === c.user_id);
      const entry = {
        user_id: String(c.user_id || ''),
        name: String(user?.name || 'Unknown'),
        amount: Number(c.amount) || 0,
        created_at: Number(c.created_at) || 0,
      };
      const existing = claimMap.get(entry.user_id);
      if (!existing || entry.created_at > existing.created_at) {
        claimMap.set(entry.user_id, entry);
      }
    }

    const recentClaims = Array.from(claimMap.values())
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, 10);

    const claims24h = recentClaims.filter((c) => c.created_at > now - h24).length;
    const claims24hVolume = recentClaims
      .filter((c) => c.created_at > now - h24)
      .reduce((s, c) => s + (c.amount || 0), 0);

    let p2pCount = 0;
    let p2pVolume = 0;
    try {
      const transfers = await all('p2p_transfers', 'created_at', 1000);
      p2pCount = transfers.length;
      p2pVolume = transfers.reduce((s: number, t: Record<string, unknown>) => s + (Number(t.gross_amount) || 0), 0);
    } catch { /* */ }

    let withdrawals = 0;
    let withdrawalVolume = 0;
    try {
      const w = await all('withdrawals', 'created_at', 1000);
      withdrawals = w.length;
      withdrawalVolume = w.reduce((s: number, r: Record<string, unknown>) => s + (Number(r.amount) || 0), 0);
    } catch { /* */ }

    return NextResponse.json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalBalance,
      totalClaimed,
      totalPackageSpend,
      withPackage,
      topDirects,
      topTeam,
      recentClaims,
      claims24h,
      claims24hVolume,
      p2pCount,
      p2pVolume,
      withdrawals,
      withdrawalVolume,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
