'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { detectApiUrl, formatTimeAgo } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalClaims: number;
  packageCount: number;
  packageSales: number;
  pendingWithdrawals: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalVolume: number;
  revenue: number;
  activePackages: number;
}

interface User {
  id: string;
  uid: string;
  name: string;
  email: string;
  balance: number;
  package: string;
  packageName: string;
  streak: number;
  createdAt: number;
  created_at: number;
}

export default function AdminDashboardPage() {
  const { uid, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleanupRunning, setCleanupRunning] = useState(false);
  const [cleanupDone, setCleanupDone] = useState(false);
  const [recalcRunning, setRecalcRunning] = useState(false);
  const [recalcDone, setRecalcDone] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!uid) return;
    loadAll();
  }, [uid, authLoading]);

  async function loadAll() {
    setLoading(true);
    await Promise.allSettled([loadStats(), loadUsers()]);
    setLoading(false);
  }

  async function loadStats() {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/stats`, { headers: { 'x-auth-uid': uid! } });
      if (res.ok) setStats(await res.json());
    } catch {}
  }

  async function loadUsers() {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/users`, { headers: { 'x-auth-uid': uid! } });
      if (res.ok) {
        const data = await res.json();
        const list: User[] = Array.isArray(data) ? data.map((u: Record<string, unknown>) => ({
          id: String(u.id || u.uid || ''),
          uid: String(u.uid || u.id || ''),
          name: String(u.name || ''),
          email: String(u.email || ''),
          balance: Number(u.balance || 0),
          package: String(u.package || ''),
          packageName: String(u.packageName || u.package || ''),
          streak: Number(u.streak || 0),
          createdAt: Number(u.createdAt || u.created_at || 0),
          created_at: Number(u.created_at || u.createdAt || 0),
        })) : [];
        setUsers(list);
      }
    } catch {}
  }

  async function runCleanup() {
    setCleanupRunning(true);
    setCleanupDone(false);
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/cleanup`, { method: 'POST', headers: { 'x-auth-uid': uid! } });
      if (res.ok) {
        setCleanupDone(true);
        setTimeout(() => setCleanupDone(false), 3000);
        await loadAll();
      }
    } catch {}
    setCleanupRunning(false);
  }

  async function runLeaderRecalc() {
    setRecalcRunning(true);
    setRecalcDone(false);
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/leaders/recalculate`, { method: 'POST', headers: { 'x-auth-uid': uid! } });
      if (res.ok) {
        setRecalcDone(true);
        setTimeout(() => setRecalcDone(false), 3000);
      }
    } catch {}
    setRecalcRunning(false);
  }

  const recentUsers = users.slice(-10).reverse();
  const pendingWD = stats?.pendingWithdrawals ?? 0;
  const totalONC = users.reduce((s, u) => s + u.balance, 0);
  const totalClaimed = stats?.totalClaims ?? 0;
  const activeStreaks = users.filter((u) => u.streak > 0).length;

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: '20px 18px',
    backdropFilter: 'blur(8px)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 6,
  };

  const valueStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 26,
    fontWeight: 800,
    lineHeight: 1,
  };

  const sectionStyle: React.CSSProperties = {
    ...cardStyle,
    padding: 22,
  };

  const sectionTitle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, border: '3px solid rgba(167,139,250,0.1)', borderTop: '3px solid #a78bfa', borderRadius: '50%', animation: 'dashSpin 1s linear infinite', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase' as const, fontWeight: 700 }}>Loading dashboard...</div>
            <style>{`@keyframes dashSpin { to { transform: rotate(360deg) } }`}</style>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
            {/* Total Users */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ ...labelStyle, marginBottom: 0 }}>Total Users</div>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(167,139,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
              </div>
              <div style={{ ...valueStyle, color: '#a78bfa' }}>{stats?.totalUsers ?? '—'}</div>
            </div>

            {/* Active Packages */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ ...labelStyle, marginBottom: 0 }}>Active Packages</div>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                </div>
              </div>
              <div style={{ ...valueStyle, color: '#22c55e' }}>{stats?.activePackages ?? stats?.packageCount ?? '—'}</div>
            </div>

            {/* Pending Withdrawals */}
            <div style={{ ...cardStyle, border: pendingWD > 0 ? '1px solid rgba(239,68,68,0.25)' : cardStyle.border }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ ...labelStyle, marginBottom: 0 }}>Pending W/D</div>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: pendingWD > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(251,191,36,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={pendingWD > 0 ? '#ef4444' : '#fbbf24'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
              </div>
              <div style={{ ...valueStyle, color: pendingWD > 0 ? '#ef4444' : '#fbbf24' }}>{pendingWD}</div>
            </div>

            {/* Total Revenue */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ ...labelStyle, marginBottom: 0 }}>Total Revenue</div>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
              </div>
              <div style={{ ...valueStyle, color: '#22c55e' }}>${(stats?.revenue ?? stats?.packageSales ?? 0).toLocaleString()}</div>
            </div>
          </div>

          {/* Platform Health */}
          <div style={sectionStyle}>
            <div style={sectionTitle}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              Platform Health
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
              <div style={{ background: 'rgba(167,139,250,0.06)', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(167,139,250,0.1)' }}>
                <div style={{ ...labelStyle, color: 'rgba(167,139,250,0.5)' }}>Total ONC in System</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 800, color: '#a78bfa' }}>{totalONC.toLocaleString()}</div>
              </div>
              <div style={{ background: 'rgba(34,197,94,0.06)', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(34,197,94,0.1)' }}>
                <div style={{ ...labelStyle, color: 'rgba(34,197,94,0.5)' }}>Total Claimed</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 800, color: '#22c55e' }}>{totalClaimed.toLocaleString()}</div>
              </div>
              <div style={{ background: pendingWD > 0 ? 'rgba(239,68,68,0.06)' : 'rgba(251,191,36,0.06)', borderRadius: 12, padding: '14px 16px', border: pendingWD > 0 ? '1px solid rgba(239,68,68,0.1)' : '1px solid rgba(251,191,36,0.1)' }}>
                <div style={{ ...labelStyle, color: pendingWD > 0 ? 'rgba(239,68,68,0.5)' : 'rgba(251,191,36,0.5)' }}>Pending W/D Amount</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 800, color: pendingWD > 0 ? '#ef4444' : '#fbbf24' }}>${stats?.pendingWithdrawals != null ? stats.pendingWithdrawals.toLocaleString() : '—'}</div>
              </div>
              <div style={{ background: 'rgba(96,165,250,0.06)', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(96,165,250,0.1)' }}>
                <div style={{ ...labelStyle, color: 'rgba(96,165,250,0.5)' }}>Active Streaks</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 800, color: '#60a5fa' }}>{activeStreaks}</div>
              </div>
            </div>
          </div>

          {/* Recent Users */}
          <div style={sectionStyle}>
            <div style={sectionTitle}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Recent Users
            </div>
            {recentUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>No users yet</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {['Name', 'Email', 'Package', 'Balance', 'Joined'].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, color: 'rgba(255,255,255,0.25)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((u, i) => {
                      const ts = Number(u.createdAt) || Number(u.created_at) || 0;
                      return (
                        <tr key={u.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '10px 10px', color: 'rgba(255,255,255,0.85)', fontWeight: 600, whiteSpace: 'nowrap' }}>{u.name || '—'}</td>
                          <td style={{ padding: '10px 10px', color: 'rgba(255,255,255,0.4)' }}>{u.email || '—'}</td>
                          <td style={{ padding: '10px 10px' }}>
                            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: u.package ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.05)', color: u.package ? '#a78bfa' : 'rgba(255,255,255,0.3)' }}>
                              {u.packageName || u.package || 'Free'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 10px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: '#60a5fa' }}>{u.balance.toLocaleString()}</td>
                          <td style={{ padding: '10px 10px', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>{ts ? formatTimeAgo(ts) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Actions + System Tools row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Quick Actions */}
            <div style={sectionStyle}>
              <div style={sectionTitle}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Quick Actions
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { href: '/admin/users', label: 'Users', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2|circle:9,7,4|M22 21v-2a4 4 0 0 0-3-3.87|M16 3.13a4 4 0 0 1 0 7.75', color: '#a78bfa' },
                  { href: '/admin/withdrawals', label: 'Withdrawals', icon: 'M2 4h20v16H2z|r:2|10,10,3,3', color: '#22c55e' },
                  { href: '/admin/stats', label: 'Analytics', icon: 'M3 3v18h18|M7 16l4-8 4 4 5-9', color: '#60a5fa' },
                  { href: '/admin/campaign', label: 'Campaigns', icon: 'M22 2L11 13|22 2l-7 20-4-9-9-4z', color: '#fbbf24' },
                ].map((a) => (
                  <a key={a.href} href={a.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: 13, fontWeight: 600, transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.03)'; }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={a.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {a.label === 'Users' && <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}
                      {a.label === 'Withdrawals' && <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 10H18a2 2 0 0 0 0 4h4"/></>}
                      {a.label === 'Analytics' && <><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 5-9"/></>}
                      {a.label === 'Campaigns' && <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></>}
                    </svg>
                    <span style={{ flex: 1 }}>{a.label}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </a>
                ))}
              </div>
            </div>

            {/* System Tools */}
            <div style={sectionStyle}>
              <div style={sectionTitle}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                System Tools
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={runCleanup}
                  disabled={cleanupRunning}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(251,191,36,0.15)', background: 'rgba(251,191,36,0.06)', color: cleanupDone ? '#22c55e' : '#fbbf24', fontSize: 13, fontWeight: 700, cursor: cleanupRunning ? 'not-allowed' : 'pointer', opacity: cleanupRunning ? 0.6 : 1, transition: 'all 0.15s', fontFamily: "'Inter', sans-serif", textAlign: 'left' as const }}
                  onMouseEnter={(e) => { if (!cleanupRunning) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(251,191,36,0.1)'; }}
                  onMouseLeave={(e) => { if (!cleanupRunning) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(251,191,36,0.06)'; }}
                >
                  {cleanupRunning ? (
                    <div style={{ width: 16, height: 16, border: '2px solid rgba(251,191,36,0.2)', borderTop: '2px solid #fbbf24', borderRadius: '50%', animation: 'dashSpin 1s linear infinite' }} />
                  ) : cleanupDone ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  )}
                  <span>{cleanupDone ? 'Cleanup Complete' : cleanupRunning ? 'Running Cleanup...' : 'Run Cleanup'}</span>
                </button>

                <button
                  onClick={runLeaderRecalc}
                  disabled={recalcRunning}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(167,139,250,0.15)', background: 'rgba(167,139,250,0.06)', color: recalcDone ? '#22c55e' : '#a78bfa', fontSize: 13, fontWeight: 700, cursor: recalcRunning ? 'not-allowed' : 'pointer', opacity: recalcRunning ? 0.6 : 1, transition: 'all 0.15s', fontFamily: "'Inter', sans-serif", textAlign: 'left' as const }}
                  onMouseEnter={(e) => { if (!recalcRunning) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(167,139,250,0.1)'; }}
                  onMouseLeave={(e) => { if (!recalcRunning) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(167,139,250,0.06)'; }}
                >
                  {recalcRunning ? (
                    <div style={{ width: 16, height: 16, border: '2px solid rgba(167,139,250,0.2)', borderTop: '2px solid #a78bfa', borderRadius: '50%', animation: 'dashSpin 1s linear infinite' }} />
                  ) : recalcDone ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  )}
                  <span>{recalcDone ? 'Recalculation Complete' : recalcRunning ? 'Recalculating...' : 'Leader Recalculation'}</span>
                </button>

                <div style={{ marginTop: 4, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', lineHeight: 1.6 }}>
                    <div>Cleanup removes expired sessions and stale data.</div>
                    <div>Leader recalc updates referral tier rankings.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </AdminLayout>
  );
}
