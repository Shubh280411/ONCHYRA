'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { detectApiUrl, formatTimeAgo } from '@/lib/utils';

interface AdminStatsData {
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
  recentUsers: { name?: string; email?: string; createdAt?: number; created_at?: number }[];
}

export default function AdminDashboardPage() {
  const { uid, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [storageStats, setStorageStats] = useState<{ totalMB: number; tableSizes: { table: string; totalMB: number; rows: number }[] } | null>(null);
  const [adminEmail, setAdminEmail] = useState('Admin');
  const [loading, setLoading] = useState(true);
  const [cleanupResult, setCleanupResult] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!uid) { router.push('/admin/login'); return; }
    verifyAdmin();
  }, [uid, authLoading]);

  async function verifyAdmin() {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/check`, { headers: { 'x-auth-uid': uid! } });
      if (!res.ok) { router.push('/admin/login'); return; }
      const data = await res.json();
      setAdminEmail(data.email || 'Admin');
      loadStats();
    } catch { router.push('/admin/login'); }
  }

  async function loadStats() {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/stats`, { headers: { 'x-auth-uid': uid! } });
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ }
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/storage`, { headers: { 'x-auth-uid': uid! } });
      if (res.ok) setStorageStats(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function runCleanup() {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/cleanup`, { method: 'POST', headers: { 'x-auth-uid': uid! } });
      if (res.ok) { setCleanupResult(true); setTimeout(() => setCleanupResult(false), 3000); loadStats(); }
    } catch { /* ignore */ }
  }

  function handleLogout() {
    import('firebase/auth').then(({ signOut }) => {
      import('firebase/app').then(({ getApps, initializeApp }) => {
        const app = getApps().length ? getApps()[0] : initializeApp({ apiKey: 'AIzaSyDLAekP6DO0oKQQzD7USkiyCm0M3BFoyYI', authDomain: 'onchyra.firebaseapp.com', projectId: 'onchyra' });
        signOut(require('firebase/auth').getAuth(app)).then(() => router.push('/admin/login'));
      });
    });
  }

  const navSections = [
    { title: 'User Management', links: [{ href: '/admin/users', label: 'User Panel', badge: 'Advanced', color: '#a78bfa' }] },
    { title: 'Finance & Rewards', links: [
      { href: '/admin/stats', label: 'Analytics', badge: 'Stats', color: '#a78bfa' },
      { href: '/admin/withdrawals', label: 'Withdrawals', badge: 'Approve', color: '#22c55e' },
    ]},
    { title: 'Content & Communication', links: [
      { href: '/admin/campaign', label: 'Campaigns', badge: null, color: '#a78bfa' },
      { href: '/admin/notifications', label: 'Notifications', badge: null, color: '#f59e0b' },
    ]},
  ];

  const SvgGrid = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
  const SvgUsers = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="18 8 20 10 23 7"/></svg>;
  const SvgDatabase = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/></svg>;
  const SvgBarChart = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6"/><path d="M6 20v-4"/><path d="M18 20v-8"/></svg>;
  const SvgLogout = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
  const SvgDollar = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
  const SvgSend = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4Z"/></svg>;
  const SvgBell = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
  const SvgCheck = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#03040a' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(167,139,250,0.1)', borderTop: '3px solid #a78bfa', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase' as const, fontWeight: 700 }}>Loading admin panel...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '30px 16px', background: '#03040a', backgroundImage: 'radial-gradient(ellipse at 20% 0%, rgba(167,139,250,0.07) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(96,165,250,0.05) 0%, transparent 50%)', color: 'white', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 800, width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 900, fontSize: 18, color: '#000' }}>ON</div>
            <div>
              <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 800, margin: 0 }}>
                <span style={{ color: '#a78bfa' }}>ONCHYRA</span> Admin
              </h1>
            </div>
          </div>
          <div style={{ padding: '6px 14px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.15)' }}>
            {adminEmail}
          </div>
        </div>

        {/* Platform Overview */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, marginBottom: 20, backdropFilter: 'blur(8px)' }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <SvgGrid /> Platform Overview
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Users', value: stats?.totalUsers ?? '—' },
              { label: 'Active Users', value: stats?.activeUsers ?? '—' },
              { label: 'Total Deposits', value: stats?.totalDeposits != null ? `$${stats.totalDeposits.toFixed(0)}` : '—' },
              { label: 'Total Withdrawals', value: stats?.totalWithdrawals != null ? `$${stats.totalWithdrawals.toFixed(0)}` : '—' },
              { label: 'Pending W/D', value: stats?.pendingWithdrawals ?? '—' },
              { label: 'Revenue', value: stats?.revenue != null ? `$${stats.revenue.toFixed(0)}` : stats?.packageSales != null ? `$${stats.packageSales.toFixed(0)}` : '—' },
              { label: 'Active Packages', value: stats?.activePackages ?? stats?.packageCount ?? '—' },
            ].map((s) => (
              <div key={s.label} style={{ flex: '1 1 120px', minWidth: 120 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 800, marginTop: 2 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Joins */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, marginBottom: 20, backdropFilter: 'blur(8px)' }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <SvgUsers /> Recent Joins
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(stats?.recentUsers || []).slice(0, 5).length === 0 && (
              <div style={{ textAlign: 'center', padding: 16, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>No users yet</div>
            )}
            {(stats?.recentUsers || []).slice(0, 5).map((u, i) => {
              const initial = (u.name || u.email || '?')[0].toUpperCase();
              const ts = Number(u.createdAt) || Number(u.created_at) || 0;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 13, color: '#000', flexShrink: 0 }}>{initial}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{u.name || u.email || 'Unknown'}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{ts ? formatTimeAgo(ts) : ''}{u.email ? ` · ${u.email}` : ''}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Database Storage */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, marginBottom: 20, backdropFilter: 'blur(8px)' }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <SvgDatabase /> Database Storage
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 120px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, color: 'rgba(255,255,255,0.3)' }}>DB Size</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 800 }}>{storageStats?.totalMB ? `${storageStats.totalMB} MB` : '—'}</div>
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, color: 'rgba(255,255,255,0.3)' }}>Total Rows</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 800 }}>{storageStats?.tableSizes?.reduce((a, t) => a + Number(t.rows || 0), 0).toLocaleString() ?? '—'}</div>
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, color: 'rgba(255,255,255,0.3)' }}>Tables</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 800 }}>{storageStats?.tableSizes?.length ?? '—'}</div>
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, color: 'rgba(255,255,255,0.3)' }}>Largest Table</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 800 }}>{storageStats?.tableSizes?.sort((a, b) => b.totalMB - a.totalMB)[0] ? `${storageStats.tableSizes.sort((a, b) => b.totalMB - a.totalMB)[0].table} (${storageStats.tableSizes.sort((a, b) => b.totalMB - a.totalMB)[0].totalMB} MB)` : '—'}</div>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.25)', display: 'flex', gap: 12, alignItems: 'center' }}>
            <span>Auto-cleanup every 6hrs</span>
            <button onClick={runCleanup} style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.15)', color: '#a78bfa', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Cleanup Now</button>
            {cleanupResult && <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}><SvgCheck /> Done</span>}
          </div>
        </div>

        {/* Nav Sections */}
        {navSections.map((section) => (
          <div key={section.title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, marginBottom: 20, backdropFilter: 'blur(8px)' }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <SvgBarChart /> {section.title}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {section.links.map((link) => (
                <a key={link.href} href={link.href} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '14px 16px', border: 'none', borderRadius: 12, background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.8)', fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' as const, textDecoration: 'none', borderRight: 'none' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={link.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span style={{ flex: 1 }}>{link.label}</span>
                  {link.badge && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>{link.badge}</span>}
                </a>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 14, border: 'none', borderRadius: 12, background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', marginTop: 4 }}>
          <SvgLogout /> Logout
        </button>
      </div>
    </div>
  );
}
