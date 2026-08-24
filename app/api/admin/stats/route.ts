import { NextRequest, NextResponse } from 'next/server';
import { get, all, findWhere } from '@/lib/db';
import { cc } from '@/lib/utils';

async function requireAdmin(request: NextRequest) {
  const uid = request.headers.get('x-auth-uid');
  if (!uid) return { error: 'No uid', status: 401 };
  const admin = await get('admins', uid);
  if (!admin) return { error: 'Not admin', status: 403 };
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const authErr = await requireAdmin(request);
    if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

    const [users, deposits, withdrawals, rewards, bonuses, packages, claims] = await Promise.all([
      all('users'),
      findWhere('deposits', { status: 'completed' }),
      all('withdrawals'),
      all('leadership_rewards'),
      all('achievement_bonuses'),
      all('package_purchases'),
      all('claims'),
    ]);

    const totalUsers = users.length;
    const totalDeposits = deposits.reduce((s, d) => s + Number(d.amount || 0), 0);
    const totalWithdrawals = withdrawals.reduce((s, d) => s + Number(d.amount || 0), 0);
    const pendingWithdrawals = withdrawals.filter(d => d.status === 'pending').length;
    const completedWithdrawals = withdrawals.filter(d => d.status === 'completed').length;
    const totalRewards = rewards.reduce((s, d) => s + Number(d.amount || 0), 0);
    const totalBonuses = bonuses.reduce((s, d) => s + Number(d.amount || 0), 0);
    const totalPackageSales = packages.reduce((s, d) => s + Number(d.amount || 0), 0);
    const packageCount = packages.length;
    const totalClaims = claims.length;

    const usersWithPackage = users.filter(u => u.active_package).length;
    const usersWithoutPackage = totalUsers - usersWithPackage;

    const rankCounts: Record<string, number> = {};
    for (const u of users) rankCounts[(u.rank as string) || 'member'] = (rankCounts[(u.rank as string) || 'member'] || 0) + 1;

    const nameMap: Record<string, string> = {};
    for (const u of users) nameMap[u.uid as string] = (u.name as string) || (u.uid as string || '').slice(0, 8);

    const depositByUser: Record<string, number> = {};
    for (const d of deposits) {
      if (d.uid) depositByUser[d.uid as string] = (depositByUser[d.uid as string] || 0) + Number(d.amount || 0);
    }
    const topDepositors = Object.entries(depositByUser)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([uid, amount]) => ({ uid, name: nameMap[uid] || 'Unknown', amount }));

    const toMs = (val: unknown) => Number(val) || 0;

    const pendingWithdrawalsList = withdrawals
      .filter(d => d.status === 'pending')
      .map(d => ({ id: d.id, uid: d.uid, amount: d.amount, wallet: d.wallet, createdAt: d.created_at }))
      .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));

    const packageSales: Record<string, { count: number; revenue: number }> = {};
    packages.forEach(d => {
      const name = (d.package_name as string) || (d.name as string) || 'unknown';
      if (!packageSales[name]) packageSales[name] = { count: 0, revenue: 0 };
      packageSales[name].count++;
      packageSales[name].revenue += Number(d.amount || 0);
    });
    const packageBreakdown = Object.entries(packageSales).map(([name, data]) => ({ name, count: data.count, revenue: data.revenue }));

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();
    let todayDeposits = 0, todayWithdrawals = 0, todayRewards = 0, todayRegistrations = 0;
    deposits.forEach(d => { if (toMs(d.created_at) >= todayMs) todayDeposits += Number(d.amount || 0); });
    withdrawals.forEach(d => { if (toMs(d.created_at) >= todayMs) todayWithdrawals += Number(d.amount || 0); });
    rewards.forEach(d => { if (toMs(d.created_at) >= todayMs) todayRewards += Number(d.amount || 0); });
    users.forEach(u => { if (toMs(u.created_at) >= todayMs) todayRegistrations++; });

    const allRewards = rewards.map(r => ({
      ...(cc(r) as Record<string, unknown>),
      userName: nameMap[r.uid as string] || (r.uid as string || '').slice(0, 8),
    }));
    allRewards.sort((a, b) => toMs((b as Record<string, unknown>).createdAt) - toMs((a as Record<string, unknown>).createdAt));
    const recentRewards = allRewards.slice(0, 15);

    const recentDeposits = deposits
      .map(cc)
      .sort((a, b) => toMs((b as Record<string, unknown>).createdAt) - toMs((a as Record<string, unknown>).createdAt))
      .slice(0, 15);

    const recentUsers = users.map(u => cc(u)).sort((a, b) =>
      toMs((b as Record<string, unknown>).createdAt) - toMs((a as Record<string, unknown>).createdAt)
    ).slice(0, 10);

    const wdByUser: Record<string, number> = {}, wdCountByUser: Record<string, number> = {};
    withdrawals.forEach(d => {
      if (d.status !== 'completed') return;
      if (!d.uid) return;
      wdByUser[d.uid as string] = (wdByUser[d.uid as string] || 0) + Number(d.amount || 0);
      wdCountByUser[d.uid as string] = (wdCountByUser[d.uid as string] || 0) + 1;
    });
    const topWithdrawers = Object.entries(wdByUser)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([uid, amount]) => ({ uid, name: nameMap[uid] || 'Unknown', amount, count: wdCountByUser[uid] || 0 }));

    return NextResponse.json({
      totalUsers, usersWithPackage, usersWithoutPackage,
      totalDeposits, totalWithdrawals, pendingWithdrawals, completedWithdrawals,
      totalRewards, totalBonuses, totalPackageSales, packageCount, totalClaims,
      rankCounts, topDepositors, users: users.map(cc),
      pendingWithdrawalsList, packageBreakdown,
      todayDeposits, todayWithdrawals, todayRewards, todayRegistrations,
      recentRewards, recentDeposits, topWithdrawers, recentUsers
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
