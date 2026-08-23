'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { detectApiUrl } from '@/lib/utils';
import Loading from '@/components/ui/Loading';
import { AdminStats } from '@/types';

const RANKS = ['Ignition', 'Momentum', 'Velocity', 'Quantum', 'Fusion', 'Infinity', 'Titan', 'Apex', 'Zenith', 'Legacy'];
const RANK_COLORS = ['#a78bfa', '#818cf8', '#60a5fa', '#38bdf8', '#22c55e', '#16a34a', '#eab308', '#f97316', '#ef4444', '#dc2626'];
const PKG_LIST = ['starter', 'builder', 'pioneer', 'elite', 'titan', 'dominion', 'legacy'];
const PKG_NAMES: Record<string, string> = { starter: 'Starter', builder: 'Builder', pioneer: 'Pioneer', elite: 'Elite', titan: 'Titan', dominion: 'Dominion', legacy: 'Legacy' };

function toMs(val: unknown): number {
  if (!val) return 0;
  if (typeof val === 'object' && val !== null && 'toMillis' in val) return (val as { toMillis: () => number }).toMillis();
  if (val instanceof Date) return val.getTime();
  return Number(val) || 0;
}

export default function AdminStatsPage() {
  const { uid, loading: authLoading } = useAuth();
  const [cached, setCached] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!uid) { router.push('/admin/login'); return; }
    loadStats();
  }, [uid, authLoading]);

  async function loadStats() {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/stats`, { headers: { 'x-auth-uid': uid! } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      setCached(data);
      setLoading(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setLoading(false);
    }
  }

  if (loading) return <Loading text="Loading stats..." />;
  if (error) return <div className="p-10 text-center text-red-400">Failed to load stats: {error}</div>;
  if (!cached) return null;

  const u = cached;
  const totalCommission = (u.users || []).reduce((s, x) => s + (x.commissionBalance || 0), 0);
  const totalWallet = (u.users || []).reduce((s, x) => s + (x.walletBalance || 0), 0);
  const totalDeposits = u.totalDeposits || 0;
  const totalWithdrawals = u.totalWithdrawals || 0;
  const totalRewards = u.totalRewards || 0;
  const totalAchievement = u.totalBonuses || 0;
  const totalUsers = u.totalUsers || 0;
  const activeUsers = u.usersWithPackage || 0;
  const allPending = u.pendingWithdrawalsList || [];
  const bigPending = allPending.filter((w) => Number(w.amount || 0) >= 50);

  const rankCount: Record<string, number> = {};
  let unranked = 0;
  (u.users || []).forEach((us) => {
    const r = us.rank;
    if (r && RANKS.includes(r)) rankCount[r] = (rankCount[r] || 0) + 1;
    else unranked++;
  });
  const rankTotal = Object.values(rankCount).reduce((a, b) => a + b, 0) + unranked;

  const pkgSales = u.packageBreakdown || [];
  const totalSold = u.packageCount || 0;

  let totalOnc = 0, claimedToday = 0, longestStreak = 0, streakUsers = 0;
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  (u.users || []).forEach((us) => {
    totalOnc += (us.balance || 0);
    if (us.lastClaim && us.lastClaim >= todayStart.getTime()) claimedToday++;
    if ((us.streakDays || 0) > longestStreak) longestStreak = us.streakDays || 0;
    if ((us.streakDays || 0) >= 7) streakUsers++;
  });

  return (
    <div className="min-h-screen bg-[#03040a] text-white p-7 max-w-[1200px] mx-auto">
      <h1 className="font-[family-name:var(--font-space-grotesk)] text-[28px] font-extrabold mb-6 flex items-center gap-2.5">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        ONCHYRA — Stats &amp; Analytics
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5 mb-7">
        {[
          { label: 'Total Deposits', val: `$${totalDeposits.toFixed(2)}`, sub: `${Math.round(totalDeposits / 25)} packages worth`, color: 'text-green-500' },
          { label: 'Total Withdrawals', val: `$${totalWithdrawals.toFixed(2)}`, sub: `Net: $${(totalDeposits - totalWithdrawals).toFixed(2)}`, color: 'text-red-500' },
          { label: 'Rewards Paid Out', val: `$${(totalRewards + totalAchievement).toFixed(2)}`, sub: `$${totalRewards.toFixed(2)} daily + $${totalAchievement.toFixed(2)} bonuses`, color: 'text-yellow-500' },
          { label: 'Total Users', val: String(totalUsers), sub: `${activeUsers} active package holders`, color: 'text-[var(--secondary)]' },
          { label: 'Held Commission', val: `$${totalCommission.toFixed(2)}`, sub: `$${totalWallet.toFixed(2)} in wallet balances`, color: 'text-[var(--primary)]' },
          { label: 'Avg per User', val: `$${totalUsers > 0 ? (totalDeposits / totalUsers).toFixed(2) : '0.00'}`, sub: `$${totalUsers > 0 ? (totalWithdrawals / totalUsers).toFixed(2) : '0.00'} avg withdrawal`, color: 'text-orange-400' },
        ].map((c) => (
          <div key={c.label} className="bg-white/[0.04] border border-white/[0.1] rounded-2xl p-5 transition-all hover:border-white/20">
            <div className="text-[11px] text-white/50 uppercase tracking-wider mb-1 flex items-center gap-1.5">{c.label}</div>
            <div className={`font-[family-name:var(--font-space-grotesk)] text-[30px] font-extrabold ${c.color}`}>{c.val}</div>
            <div className="text-xs opacity-40 mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Two column sections */}
      <div className="grid grid-cols-2 gap-5 mb-5 max-md:grid-cols-1">
        {/* Pending Withdrawals */}
        <Section title="Pending Withdrawals">
          {allPending.length === 0 ? <Empty /> : (
            <>
              <Table headers={['User', 'Amount', 'Wallet', 'Date']}>
                {allPending.slice(0, 10).map((w, i) => (
                  <tr key={i}>
                    <td>{(w.uid || '').slice(0, 8)}...</td>
                    <td className="font-bold text-yellow-500">${Number(w.amount || 0).toFixed(2)}</td>
                    <td className="text-[9px]">{(w.wallet || '-').slice(0, 14)}...</td>
                    <td className="text-[11px] opacity-50">{w.createdAt ? new Date(toMs(w.createdAt)).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </Table>
              <div className="mt-2 text-xs opacity-50">Total pending: {allPending.length} requests · ${allPending.reduce((s, w) => s + Number(w.amount || 0), 0).toFixed(2)}</div>
            </>
          )}
        </Section>

        {/* Large Pending */}
        <Section title="Large Pending ($50+)">
          {bigPending.length === 0 ? <Empty /> : (
            <Table headers={['User', 'Amount', 'Wallet', 'Date']}>
              {bigPending.map((w, i) => (
                <tr key={i} className="bg-red-500/5">
                  <td>{(w.uid || '').slice(0, 8)}...</td>
                  <td className="font-extrabold text-red-500">${Number(w.amount || 0).toFixed(2)}</td>
                  <td className="text-[9px]">{(w.wallet || '-').slice(0, 14)}...</td>
                  <td className="text-[11px] opacity-50">{w.createdAt ? new Date(toMs(w.createdAt)).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </Table>
          )}
        </Section>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5 max-md:grid-cols-1">
        {/* Ranks */}
        <Section title="Rank Holders">
          <div className="flex h-7 rounded-[14px] overflow-hidden bg-white/[0.03] mb-2.5">
            {RANKS.filter((r) => rankCount[r]).map((r) => {
              const pct = (rankCount[r] / rankTotal) * 100;
              return <div key={r} className="flex items-center justify-center text-[9px] font-bold text-black min-w-0 overflow-hidden" style={{ width: `${pct}%`, background: RANK_COLORS[RANKS.indexOf(r)] }}>{pct > 5 ? rankCount[r] : ''}</div>;
            })}
            {unranked > 0 && <div className="flex items-center justify-center text-[9px] font-bold min-w-0 overflow-hidden text-white/50" style={{ width: `${(unranked / rankTotal) * 100}%`, background: 'rgba(255,255,255,0.1)' }}>{(unranked / rankTotal) * 100 > 5 ? unranked : ''}</div>}
          </div>
          <Table headers={['Rank', 'Count', '%', 'Bar']}>
            {RANKS.filter((r) => rankCount[r]).map((r) => {
              const pct = ((rankCount[r] / rankTotal) * 100).toFixed(1);
              const color = RANK_COLORS[RANKS.indexOf(r)];
              return <tr key={r}><td className="font-bold" style={{ color }}>{r}</td><td className="font-extrabold">{rankCount[r]}</td><td className="opacity-50">{pct}%</td><td><div className="h-2 rounded-sm" style={{ background: color, width: `${pct}%`, maxWidth: 120 }} /></td></tr>;
            })}
          </Table>
        </Section>

        {/* Package Sales */}
        <Section title="Package Sales">
          <div className="text-[24px] font-extrabold mb-2.5">{totalSold} <span className="text-sm font-normal opacity-50">packages sold</span></div>
          <div className="text-lg font-bold text-green-500 mb-4">${(u.totalPackageSales || 0).toFixed(2)} <span className="text-xs font-normal opacity-50">total revenue</span></div>
          <Table headers={['Package', 'Sold', 'Revenue', '%']}>
            {PKG_LIST.map((p) => {
              const count = pkgSales.find((x) => x.name === p)?.count || 0;
              const rev = pkgSales.find((x) => x.name === p)?.revenue || 0;
              if (count === 0) return null;
              const pct = ((count / totalSold) * 100).toFixed(1);
              return <tr key={p}><td className="font-bold">{PKG_NAMES[p]}</td><td className="font-extrabold">{count}</td><td className="text-green-500 font-bold">${rev.toFixed(2)}</td><td className="opacity-50">{pct}%</td></tr>;
            })}
          </Table>
        </Section>
      </div>

      {/* Daily Activity */}
      <Section title="Today's Activity">
        <div className="grid grid-cols-4 gap-2.5 mb-0 max-md:grid-cols-2">
          {[
            { label: 'Deposits Today', val: `$${(u.todayDeposits || 0).toFixed(2)}`, color: 'text-green-500' },
            { label: 'Withdrawals Today', val: `$${(u.todayWithdrawals || 0).toFixed(2)}`, color: 'text-red-500' },
            { label: 'Rewards Today', val: `$${(u.todayRewards || 0).toFixed(2)}`, color: 'text-yellow-500' },
            { label: 'New Today', val: String(u.todayRegistrations || 0), color: 'text-[var(--secondary)]' },
          ].map((d) => (
            <div key={d.label} className="bg-white/[0.04] border border-white/[0.1] rounded-2xl p-3.5">
              <div className="text-[11px] text-white/50 uppercase tracking-wider mb-1">{d.label}</div>
              <div className={`font-[family-name:var(--font-space-grotesk)] text-[22px] font-extrabold ${d.color}`}>{d.val}</div>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid grid-cols-2 gap-5 mb-5 max-md:grid-cols-1">
        <Section title="Recent Leadership Rewards">
          {(u.recentRewards || []).length === 0 ? <Empty /> : (
            <Table headers={['User', 'Rank', 'Day', 'Amount', 'Date']}>
              {(u.recentRewards || []).slice(0, 10).map((r, i) => (
                <tr key={i}>
                  <td>{r.uid?.slice(0, 8) || '-'}</td>
                  <td><span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[var(--primary)]/15 text-[var(--primary)]">{r.rank || '-'}</span></td>
                  <td>{r.id?.slice(-1) || '-'}</td>
                  <td className="font-bold text-yellow-500">${Number(r.amount || 0).toFixed(2)}</td>
                  <td className="text-[11px] opacity-50">{r.createdAt ? new Date(toMs(r.createdAt)).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </Table>
          )}
        </Section>

        <Section title="Top Depositors">
          {(u.topDepositors || []).length === 0 ? <Empty /> : (
            <Table headers={['#', 'User', 'Total Deposited']}>
              {(u.topDepositors || []).map((d, i) => (
                <tr key={i}>
                  <td className="font-extrabold" style={{ color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--success)' }}>#{i + 1}</td>
                  <td>{d.name || d.uid?.slice(0, 8)}</td>
                  <td className="font-bold text-green-500">${Number(d.amount || 0).toFixed(2)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Section>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5 max-md:grid-cols-1">
        {/* Commission Leaderboard */}
        <Section title="Commission Leaderboard">
          {(() => {
            const list = (u.users || []).filter((us) => (us.commissionBalance || 0) > 0).sort((a, b) => (b.commissionBalance || 0) - (a.commissionBalance || 0)).slice(0, 10);
            if (list.length === 0) return <Empty />;
            return (
              <Table headers={['#', 'User', 'Commission', 'Rank']}>
                {list.map((us, i) => (
                  <tr key={i}>
                    <td className="font-extrabold" style={{ color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--primary)' }}>#{i + 1}</td>
                    <td>{us.name || us.uid?.slice(0, 8)}</td>
                    <td className="font-bold text-green-500">${Number(us.commissionBalance || 0).toFixed(2)}</td>
                    <td><span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[var(--primary)]/15 text-[var(--primary)]">{us.rank || 'Unranked'}</span></td>
                  </tr>
                ))}
              </Table>
            );
          })()}
        </Section>

        {/* Mining Overview */}
        <Section title="Mining Overview">
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Total ONC in System', val: totalOnc.toFixed(2), color: 'text-yellow-500' },
              { label: 'Claimed Today', val: String(claimedToday), color: 'text-green-500' },
              { label: 'Longest Streak', val: `${longestStreak} days`, color: 'text-[var(--primary)]' },
              { label: 'Users with 7+ Streak', val: String(streakUsers), color: 'text-[var(--secondary)]' },
            ].map((d) => (
              <div key={d.label} className="bg-white/[0.04] border border-white/[0.1] rounded-2xl p-3.5">
                <div className="text-[11px] text-white/50 uppercase tracking-wider mb-1">{d.label}</div>
                <div className={`font-[family-name:var(--font-space-grotesk)] text-[22px] font-extrabold ${d.color}`}>{d.val}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Top Withdrawers */}
      <Section title="Top Withdrawers">
        {(u.topWithdrawers || []).length === 0 ? <Empty /> : (
          <Table headers={['#', 'User', 'Total Withdrawn', 'Count']}>
            {(u.topWithdrawers || []).map((w, i) => (
              <tr key={i}>
                <td className="font-extrabold" style={{ color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--red)' }}>#{i + 1}</td>
                <td>{w.name || w.uid?.slice(0, 8)}</td>
                <td className="font-bold text-red-500">${Number(w.amount || 0).toFixed(2)}</td>
                <td className="opacity-50">{w.count || 0}x</td>
              </tr>
            ))}
          </Table>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.1] rounded-[18px] p-5 mb-5">
      <div className="font-[family-name:var(--font-space-grotesk)] text-base font-bold mb-3.5 flex items-center gap-2">{title}</div>
      {children}
    </div>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full border-collapse text-[13px]">
      <thead><tr>{headers.map((h) => <th key={h} className="text-left py-2.5 px-2 text-white/50 font-semibold text-[10px] uppercase tracking-wider border-b border-white/[0.1]">{h}</th>)}</tr></thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function Empty() {
  return <em className="opacity-30 text-sm">Loading...</em>;
}
