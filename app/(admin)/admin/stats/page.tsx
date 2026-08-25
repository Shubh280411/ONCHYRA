'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { detectApiUrl } from '@/lib/utils';
import { AdminStats } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';

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
  const { uid } = useAuth();
  const [cached, setCached] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uid) return;
    loadStats();
  }, [uid]);

  async function loadStats() {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/stats`, { headers: { 'x-auth-uid': uid! } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setCached(await res.json());
      setLoading(false);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to load'); setLoading(false); }
  }

  if (loading) return (
    <AdminLayout title="Analytics & Stats">
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(167,139,250,0.1)', borderTop: '3px solid #a78bfa', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase' as const, fontWeight: 700 }}>Loading stats...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </AdminLayout>
  );
  if (error) return <AdminLayout title="Analytics & Stats"><div style={{ padding: 40, textAlign: 'center', color: '#f87171' }}>Failed to load stats: {error}</div></AdminLayout>;
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
  (u.users || []).forEach((us) => { const r = us.rank; if (r && RANKS.includes(r)) rankCount[r] = (rankCount[r] || 0) + 1; else unranked++; });
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

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: 20, marginBottom: 20 }}>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>{title}</div>
      {children}
    </div>
  );

  const Table = ({ headers, children }: { headers: string[]; children: React.ReactNode }) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead><tr>{headers.map((h) => <th key={h} style={{ textAlign: 'left', padding: '10px 8px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>{h}</th>)}</tr></thead>
      <tbody>{children}</tbody>
    </table>
  );

  const Empty = () => <em style={{ opacity: 0.3, fontSize: 14 }}>No data available</em>;

  return (
    <AdminLayout title="Analytics & Stats">
      <div style={{ color: 'white', fontFamily: "'Inter', sans-serif" }}>
        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total Deposits', val: `$${totalDeposits.toFixed(2)}`, sub: `${Math.round(totalDeposits / 25)} packages worth`, color: '#22c55e' },
            { label: 'Total Withdrawals', val: `$${totalWithdrawals.toFixed(2)}`, sub: `Net: $${(totalDeposits - totalWithdrawals).toFixed(2)}`, color: '#ef4444' },
            { label: 'Rewards Paid Out', val: `$${(totalRewards + totalAchievement).toFixed(2)}`, sub: `$${totalRewards.toFixed(2)} daily + $${totalAchievement.toFixed(2)} bonuses`, color: '#eab308' },
            { label: 'Total Users', val: String(totalUsers), sub: `${activeUsers} active package holders`, color: '#60a5fa' },
            { label: 'Held Commission', val: `$${totalCommission.toFixed(2)}`, sub: `$${totalWallet.toFixed(2)} in wallet balances`, color: '#a78bfa' },
            { label: 'Avg per User', val: `$${totalUsers > 0 ? (totalDeposits / totalUsers).toFixed(2) : '0.00'}`, sub: `$${totalUsers > 0 ? (totalWithdrawals / totalUsers).toFixed(2) : '0.00'} avg withdrawal`, color: '#fb923c' },
          ].map((c) => (
            <div key={c.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 20, transition: 'border-color 0.3s' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 30, fontWeight: 800, color: c.color }}>{c.val}</div>
              <div style={{ fontSize: 12, opacity: 0.4, marginTop: 2 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Two column sections */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <Section title="Pending Withdrawals">
            {allPending.length === 0 ? <Empty /> : (
              <>
                <Table headers={['User', 'Amount', 'Wallet', 'Date']}>
                  {allPending.slice(0, 10).map((w, i) => (
                    <tr key={i}>
                      <td>{(w.uid || '').slice(0, 8)}...</td>
                      <td style={{ fontWeight: 700, color: '#eab308' }}>${Number(w.amount || 0).toFixed(2)}</td>
                      <td style={{ fontSize: 9 }}>{(w.wallet || '-').slice(0, 14)}...</td>
                      <td style={{ fontSize: 11, opacity: 0.5 }}>{w.createdAt ? new Date(toMs(w.createdAt)).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </Table>
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.5 }}>Total pending: {allPending.length} requests · ${allPending.reduce((s, w) => s + Number(w.amount || 0), 0).toFixed(2)}</div>
              </>
            )}
          </Section>
          <Section title="Large Pending ($50+)">
            {bigPending.length === 0 ? <Empty /> : (
              <Table headers={['User', 'Amount', 'Wallet', 'Date']}>
                {bigPending.map((w, i) => (
                  <tr key={i} style={{ background: 'rgba(239,68,68,0.05)' }}>
                    <td>{(w.uid || '').slice(0, 8)}...</td>
                    <td style={{ fontWeight: 800, color: '#ef4444' }}>${Number(w.amount || 0).toFixed(2)}</td>
                    <td style={{ fontSize: 9 }}>{(w.wallet || '-').slice(0, 14)}...</td>
                    <td style={{ fontSize: 11, opacity: 0.5 }}>{w.createdAt ? new Date(toMs(w.createdAt)).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Section>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <Section title="Rank Holders">
            <div style={{ display: 'flex', height: 28, borderRadius: 14, overflow: 'hidden', background: 'rgba(255,255,255,0.03)', marginBottom: 10 }}>
              {RANKS.filter((r) => rankCount[r]).map((r) => {
                const pct = (rankCount[r] / rankTotal) * 100;
                return <div key={r} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#000', minWidth: 0, overflow: 'hidden', width: `${pct}%`, background: RANK_COLORS[RANKS.indexOf(r)] }}>{pct > 5 ? rankCount[r] : ''}</div>;
              })}
              {unranked > 0 && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, minWidth: 0, overflow: 'hidden', color: 'rgba(255,255,255,0.5)', width: `${(unranked / rankTotal) * 100}%`, background: 'rgba(255,255,255,0.1)' }}>{(unranked / rankTotal) * 100 > 5 ? unranked : ''}</div>}
            </div>
            <Table headers={['Rank', 'Count', '%', 'Bar']}>
              {RANKS.filter((r) => rankCount[r]).map((r) => {
                const pct = ((rankCount[r] / rankTotal) * 100).toFixed(1);
                const color = RANK_COLORS[RANKS.indexOf(r)];
                return <tr key={r}><td style={{ fontWeight: 700, color }}>{r}</td><td style={{ fontWeight: 800 }}>{rankCount[r]}</td><td style={{ opacity: 0.5 }}>{pct}%</td><td><div style={{ height: 8, borderRadius: 2, background: color, width: `${pct}%`, maxWidth: 120 }} /></td></tr>;
              })}
            </Table>
          </Section>
          <Section title="Package Sales">
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>{totalSold} <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.5 }}>packages sold</span></div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e', marginBottom: 16 }}>${(u.totalPackageSales || 0).toFixed(2)} <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.5 }}>total revenue</span></div>
            <Table headers={['Package', 'Sold', 'Revenue', '%']}>
              {PKG_LIST.map((p) => {
                const count = pkgSales.find((x) => x.name === p)?.count || 0;
                const rev = pkgSales.find((x) => x.name === p)?.revenue || 0;
                if (count === 0) return null;
                const pct = ((count / totalSold) * 100).toFixed(1);
                return <tr key={p}><td style={{ fontWeight: 700 }}>{PKG_NAMES[p]}</td><td style={{ fontWeight: 800 }}>{count}</td><td style={{ color: '#22c55e', fontWeight: 700 }}>${rev.toFixed(2)}</td><td style={{ opacity: 0.5 }}>{pct}%</td></tr>;
              })}
            </Table>
          </Section>
        </div>

        <Section title="Today's Activity">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Deposits Today', val: `$${(u.todayDeposits || 0).toFixed(2)}`, color: '#22c55e' },
              { label: 'Withdrawals Today', val: `$${(u.todayWithdrawals || 0).toFixed(2)}`, color: '#ef4444' },
              { label: 'Rewards Today', val: `$${(u.todayRewards || 0).toFixed(2)}`, color: '#eab308' },
              { label: 'New Today', val: String(u.todayRegistrations || 0), color: '#60a5fa' },
            ].map((d) => (
              <div key={d.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 14 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>{d.label}</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 800, color: d.color }}>{d.val}</div>
              </div>
            ))}
          </div>
        </Section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <Section title="Recent Leadership Rewards">
            {(u.recentRewards || []).length === 0 ? <Empty /> : (
              <Table headers={['User', 'Rank', 'Day', 'Amount', 'Date']}>
                {(u.recentRewards || []).slice(0, 10).map((r, i) => (
                  <tr key={i}>
                    <td>{r.uid?.slice(0, 8) || '-'}</td>
                    <td><span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>{r.rank || '-'}</span></td>
                    <td>{r.id?.slice(-1) || '-'}</td>
                    <td style={{ fontWeight: 700, color: '#eab308' }}>${Number(r.amount || 0).toFixed(2)}</td>
                    <td style={{ fontSize: 11, opacity: 0.5 }}>{r.createdAt ? new Date(toMs(r.createdAt)).toLocaleDateString() : '-'}</td>
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
                    <td style={{ fontWeight: 800, color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#22c55e' }}>#{i + 1}</td>
                    <td>{d.name || d.uid?.slice(0, 8)}</td>
                    <td style={{ fontWeight: 700, color: '#22c55e' }}>${Number(d.amount || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Section>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <Section title="Commission Leaderboard">
            {(() => {
              const list = (u.users || []).filter((us) => (us.commissionBalance || 0) > 0).sort((a, b) => (b.commissionBalance || 0) - (a.commissionBalance || 0)).slice(0, 10);
              if (list.length === 0) return <Empty />;
              return (
                <Table headers={['#', 'User', 'Commission', 'Rank']}>
                  {list.map((us, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 800, color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#a78bfa' }}>#{i + 1}</td>
                      <td>{us.name || us.uid?.slice(0, 8)}</td>
                      <td style={{ fontWeight: 700, color: '#22c55e' }}>${Number(us.commissionBalance || 0).toFixed(2)}</td>
                      <td><span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>{us.rank || 'Unranked'}</span></td>
                    </tr>
                  ))}
                </Table>
              );
            })()}
          </Section>
          <Section title="Mining Overview">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Total ONC in System', val: totalOnc.toFixed(2), color: '#eab308' },
                { label: 'Claimed Today', val: String(claimedToday), color: '#22c55e' },
                { label: 'Longest Streak', val: `${longestStreak} days`, color: '#a78bfa' },
                { label: 'Users with 7+ Streak', val: String(streakUsers), color: '#60a5fa' },
              ].map((d) => (
                <div key={d.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 14 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>{d.label}</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 800, color: d.color }}>{d.val}</div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <Section title="Top Withdrawers">
          {(u.topWithdrawers || []).length === 0 ? <Empty /> : (
            <Table headers={['#', 'User', 'Total Withdrawn', 'Count']}>
              {(u.topWithdrawers || []).map((w, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 800, color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#ef4444' }}>#{i + 1}</td>
                  <td>{w.name || w.uid?.slice(0, 8)}</td>
                  <td style={{ fontWeight: 700, color: '#ef4444' }}>${Number(w.amount || 0).toFixed(2)}</td>
                  <td style={{ opacity: 0.5 }}>{w.count || 0}x</td>
                </tr>
              ))}
            </Table>
          )}
        </Section>
      </div>
    </AdminLayout>
  );
}
