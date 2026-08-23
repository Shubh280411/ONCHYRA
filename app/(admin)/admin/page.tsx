'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl, formatTimeAgo } from '@/lib/utils';
import Loading from '@/components/ui/Loading';
import Link from 'next/link';

interface AdminStatsData {
  totalUsers: number;
  totalClaims: number;
  packageCount: number;
  pendingWithdrawals: number;
  recentUsers: { name?: string; email?: string; createdAt?: number; created_at?: number }[];
}

export default function AdminDashboardPage() {
  const { uid, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [storageStats, setStorageStats] = useState<{ totalMB: number; tableSizes: { table: string; totalMB: number; rows: number }[] } | null>(null);
  const [adminEmail, setAdminEmail] = useState('Admin');
  const [loading, setLoading] = useState(true);
  const [cleanupResult, setCleanupResult] = useState(false);
  const { showToast, ToastComponent } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!uid) {
      router.push('/admin/login');
      return;
    }
    verifyAdmin();
  }, [uid, authLoading]);

  async function verifyAdmin() {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/check`, { headers: { 'x-auth-uid': uid! } });
      if (!res.ok) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      setAdminEmail(data.email || 'Admin');
      loadStats();
    } catch {
      router.push('/admin/login');
    }
  }

  async function loadStats() {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/stats`, { headers: { 'x-auth-uid': uid! } });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      console.warn('Stats load failed');
    }
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/storage`, { headers: { 'x-auth-uid': uid! } });
      if (res.ok) {
        const data = await res.json();
        setStorageStats(data);
      }
    } catch {
      console.warn('Storage stats failed');
    }
    setLoading(false);
  }

  async function runCleanup() {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/cleanup`, {
        method: 'POST',
        headers: { 'x-auth-uid': uid! },
      });
      if (res.ok) {
        setCleanupResult(true);
        setTimeout(() => setCleanupResult(false), 3000);
        loadStats();
      }
    } catch {
      console.warn('Cleanup failed');
    }
  }

  const navSections = [
    {
      title: 'User Management',
      links: [
        { href: '/admin/users', label: 'User Panel', badge: 'Advanced' },
      ],
    },
    {
      title: 'Finance & Rewards',
      links: [
        { href: '/admin/stats', label: 'Analytics', badge: 'Stats' },
        { href: '/admin/withdrawals', label: 'Withdrawals', badge: 'Approve' },
        { href: '/admin/predictions', label: 'Predictions' },
      ],
    },
    {
      title: 'Content & Communication',
      links: [
        { href: '/admin/campaign', label: 'Campaigns' },
        { href: '/admin/polls', label: 'Polls' },
        { href: '/admin/notifications', label: 'Notifications' },
      ],
    },
    {
      title: 'Legacy Tools',
      links: [
        { href: '/admin/contest', label: 'Contests' },
      ],
    },
  ];

  if (loading) return <Loading text="Loading admin panel..." />;

  return (
    <div className="min-h-screen flex items-start justify-center p-7 max-w-[800px] mx-auto bg-[var(--bg)] bg-[radial-gradient(ellipse_at_20%_0%,rgba(167,139,250,0.07)_0%,transparent_50%),radial-gradient(ellipse_at_80%_100%,rgba(96,165,250,0.05)_0%,transparent_50%)]">
      <div className="w-full">
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://onchyra.netlify.app/logo.png" alt="ONCHYRA" className="w-11 h-11 rounded-[14px] object-cover" />
            <div>
              <h1 className="font-[family-name:var(--font-space-grotesk)] text-[26px] font-extrabold">
                <span className="text-[var(--primary)]">ONCHYRA</span> Admin
              </h1>
            </div>
          </div>
          <div className="px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/15">
            {adminEmail}
          </div>
        </div>

        {/* Platform Overview */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-6 mb-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4 text-sm font-bold font-[family-name:var(--font-space-grotesk)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Platform Overview
          </div>
          <div className="flex gap-4 flex-wrap">
            {[
              { label: 'Total Users', value: stats?.totalUsers ?? '—' },
              { label: 'Total Claims', value: stats?.totalClaims ?? '—' },
              { label: 'Packages', value: stats?.packageCount ?? '—' },
              { label: 'Pending W/D', value: stats?.pendingWithdrawals ?? '—' },
            ].map((s) => (
              <div key={s.label} className="flex-1 min-w-[120px]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/30">{s.label}</div>
                <div className="font-[family-name:var(--font-space-grotesk)] text-[28px] font-extrabold">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Joins */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-6 mb-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4 text-sm font-bold font-[family-name:var(--font-space-grotesk)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="18 8 20 10 23 7"/></svg>
            Recent Joins
          </div>
          <div className="flex flex-col gap-2">
            {(stats?.recentUsers || []).slice(0, 5).length === 0 && (
              <div className="text-center py-4 text-white/30 text-xs">No users yet</div>
            )}
            {(stats?.recentUsers || []).slice(0, 5).map((u, i) => {
              const initial = (u.name || u.email || '?')[0].toUpperCase();
              const ts = Number(u.createdAt) || Number(u.created_at) || 0;
              return (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-white/[0.02] rounded-xl border border-white/[0.08]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center font-[family-name:var(--font-space-grotesk)] font-extrabold text-[13px] text-black flex-shrink-0">{initial}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">{u.name || u.email || 'Unknown'}</div>
                    <div className="text-[10px] text-white/30 mt-0.5">{ts ? formatTimeAgo(ts) : ''}{u.email ? ` · ${u.email}` : ''}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Database Storage */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-6 mb-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4 text-sm font-bold font-[family-name:var(--font-space-grotesk)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/></svg>
            Database Storage
          </div>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[120px]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/30">DB Size</div>
              <div className="font-[family-name:var(--font-space-grotesk)] text-[28px] font-extrabold">{storageStats?.totalMB ? `${storageStats.totalMB} MB` : '—'}</div>
            </div>
            <div className="flex-1 min-w-[120px]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/30">Tables</div>
              <div className="font-[family-name:var(--font-space-grotesk)] text-[28px] font-extrabold">{storageStats?.tableSizes?.length ?? '—'}</div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-white/25 flex gap-3 items-center">
            <span>Auto-cleanup every 6hrs</span>
            <button onClick={runCleanup} className="bg-[var(--primary)]/10 border border-[var(--primary)]/15 text-[var(--primary)] rounded-lg px-3 py-1 cursor-pointer text-[11px] font-semibold hover:opacity-80">Cleanup Now</button>
            {cleanupResult && <span className="text-[var(--success)]">✓ Done</span>}
          </div>
        </div>

        {/* Nav Sections */}
        {navSections.map((section) => (
          <div key={section.title} className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-6 mb-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4 text-sm font-bold font-[family-name:var(--font-space-grotesk)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6"/><path d="M6 20v-4"/><path d="M18 20v-8"/></svg>
              {section.title}
            </div>
            <div className="grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
              {section.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 w-full p-3.5 rounded-xl bg-white/[0.04] text-white/80 text-[13px] font-semibold border border-transparent hover:bg-[var(--primary)]/8 hover:border-[var(--primary)]/15 hover:text-white hover:-translate-y-px transition-all no-underline"
                >
                  <span className="flex-1">{link.label}</span>
                  {link.badge && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">{link.badge}</span>}
                </Link>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={() => { import('firebase/auth').then(({ signOut }) => { getClientAuth().then((auth) => { signOut(auth); router.push('/admin/login'); }); }); }}
          className="flex items-center justify-center gap-2 w-full p-3.5 rounded-xl bg-red-500/8 text-[var(--danger)] font-bold text-sm cursor-pointer border border-transparent hover:bg-red-500/15 hover:border-red-500/20 transition-all mt-1"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Logout
        </button>
      </div>
      {ToastComponent}
    </div>
  );
}

async function getClientAuth() {
  const { getAuth } = await import('firebase/auth');
  const { getApp } = await import('firebase/app');
  try {
    return getAuth(getApp());
  } catch {
    const { initializeApp } = await import('firebase/app');
    const app = initializeApp({
      apiKey: 'AIzaSyDLAekP6DO0oKQQzD7USkiyCm0M3BFoyYI',
      authDomain: 'onchyra.firebaseapp.com',
      projectId: 'onchyra',
    });
    return getAuth(app);
  }
}
