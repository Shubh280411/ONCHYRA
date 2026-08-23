import { NextRequest, NextResponse } from 'next/server';
import { query, get } from '@/lib/db';
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

    const [uRes, depRes, wdRes, rewRes, achRes, pkgRes, claimRes] = await Promise.all([
      query(`SELECT * FROM users`),
      query(`SELECT * FROM deposits WHERE status = 'completed'`),
      query(`SELECT * FROM withdrawals`),
      query(`SELECT * FROM leadership_rewards`),
      query(`SELECT * FROM achievement_bonuses`),
      query(`SELECT * FROM package_purchases`),
      query(`SELECT * FROM claims`),
    ]);

    const users = (uRes.rows.map(cc) as Record<string, unknown>[]);
    const totalUsers = users.length;
    const totalDeposits = depRes.rows.reduce((s: number, d: Record<string, unknown>) => s + Number(d.amount || 0), 0);
    const totalWithdrawals = wdRes.rows.reduce((s: number, d: Record<string, unknown>) => s + Number(d.amount || 0), 0);
    const pendingWithdrawals = wdRes.rows.filter((d: Record<string, unknown>) => d.status === 'pending').length;
    const completedWithdrawals = wdRes.rows.filter((d: Record<string, unknown>) => d.status === 'completed').length;
    const totalRewards = rewRes.rows.reduce((s: number, d: Record<string, unknown>) => s + Number(d.amount || 0), 0);
    const totalBonuses = achRes.rows.reduce((s: number, d: Record<string, unknown>) => s + Number(d.amount || 0), 0);
    const totalPackageSales = pkgRes.rows.reduce((s: number, d: Record<string, unknown>) => s + Number(d.amount || 0), 0);
    const packageCount = pkgRes.rows.length;
    const totalClaims = claimRes.rows.length;

    const usersWithPackage = users.filter((u: Record<string, unknown>) => u.activePackage).length;
    const usersWithoutPackage = totalUsers - usersWithPackage;

    const rankCounts: Record<string, number> = {};
    for (const u of users) rankCounts[(u.rank as string) || 'member'] = (rankCounts[(u.rank as string) || 'member'] || 0) + 1;

    const nameMap: Record<string, string> = {};
    for (const u of users) nameMap[u.uid as string] = (u.name as string) || (u.uid as string || '').slice(0, 8);

    const depositByUser: Record<string, number> = {};
    for (const d of depRes.rows) {
      if (d.uid) depositByUser[d.uid as string] = (depositByUser[d.uid as string] || 0) + Number(d.amount || 0);
    }
    const topDepositors = Object.entries(depositByUser)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([uid, amount]) => ({ uid, name: nameMap[uid] || 'Unknown', amount }));

    const toMs = (val: unknown) => Number(val) || 0;

    const pendingWithdrawalsList = wdRes.rows
      .filter((d: Record<string, unknown>) => d.status === 'pending')
      .map((d: Record<string, unknown>) => ({ id: d.id, uid: d.uid, amount: d.amount, wallet: d.wallet, createdAt: d.created_at }))
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => toMs(b.createdAt) - toMs(a.createdAt));

    const packageSales: Record<string, { count: number; revenue: number }> = {};
    pkgRes.rows.forEach((d: Record<string, unknown>) => {
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
    depRes.rows.forEach((d: Record<string, unknown>) => { if (toMs(d.created_at) >= todayMs) todayDeposits += Number(d.amount || 0); });
    wdRes.rows.forEach((d: Record<string, unknown>) => { if (toMs(d.created_at) >= todayMs) todayWithdrawals += Number(d.amount || 0); });
    rewRes.rows.forEach((d: Record<string, unknown>) => { if (toMs(d.created_at) >= todayMs) todayRewards += Number(d.amount || 0); });
    users.forEach((u: Record<string, unknown>) => { if (toMs(u.createdAt) >= todayMs) todayRegistrations++; });

    const allRewards = rewRes.rows.map((r: Record<string, unknown>) => {
      const converted = cc(r) as Record<string, unknown>;
      return { ...converted, userName: nameMap[r.uid as string] || (r.uid as string || '').slice(0, 8) };
    });
    (allRewards as Record<string, unknown>[]).sort((a: Record<string, unknown>, b: Record<string, unknown>) => toMs(b.createdAt) - toMs(a.createdAt));
    const recentRewards = allRewards.slice(0, 15);

    const allDeposits = depRes.rows.map(cc);
    (allDeposits as Record<string, unknown>[]).sort((a: Record<string, unknown>, b: Record<string, unknown>) => toMs(b.createdAt) - toMs(a.createdAt));
    const recentDeposits = allDeposits.slice(0, 15);

    const recentUsers = [...users].sort((a: Record<string, unknown>, b: Record<string, unknown>) => toMs(b.createdAt) - toMs(a.createdAt)).slice(0, 10);

    const wdByUser: Record<string, number> = {}, wdCountByUser: Record<string, number> = {};
    wdRes.rows.forEach((d: Record<string, unknown>) => {
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
      rankCounts, topDepositors, users,
      pendingWithdrawalsList, packageBreakdown,
      todayDeposits, todayWithdrawals, todayRewards, todayRegistrations,
      recentRewards, recentDeposits, topWithdrawers, recentUsers
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
