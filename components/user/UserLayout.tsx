'use client';

import { useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { detectApiUrl, formatTimeAgo } from '@/lib/utils';
import { Notification } from '@/types';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

interface UserLayoutProps {
  children: ReactNode;
  title?: string;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { href: '/p2p-transfer', label: 'P2P Transfer', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> },
  { href: '/referrals', label: 'Referrals', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { href: '/packages', label: 'Packages', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> },
  { href: '/income', label: 'Income', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { href: '/leadership', label: 'Leadership', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 5.2L20 8l-4 4.5L17 19l-5-3-5 3 1-6.5L4 8l5.6-.8L12 2z"/></svg> },
  { href: '/deposit', label: 'Deposit', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3h-8l-2 4h12z"/></svg> },
  { href: '/withdraw', label: 'Withdraw', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
  { href: '/contests', label: 'Contest', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> },
  { href: '/leaderboard', label: 'Leaderboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg> },
  { href: '/updates', label: 'Updates', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },

  { href: '/ai-miner', label: 'AI Miner', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/></svg> },
  { href: '/onx-airdrop', label: 'ONX Airdrop', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  { href: '/onx-withdrawal', label: 'ONX Withdrawal', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { href: '/news', label: 'News', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg> },
  { href: '/support', label: 'Support', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
] as const;

export default function UserLayout({ children, title }: UserLayoutProps) {
  const { user, uid, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userName, setUserName] = useState('');
  const [banned, setBanned] = useState<{ isBanned: boolean; reason: string } | null>(null);
  const [appealSent, setAppealSent] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealLoading, setAppealLoading] = useState(false);
  const [activePopup, setActivePopup] = useState<{ id: string; title: string; message: string; color: string } | null>(null);
  const apiUrl = detectApiUrl();

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const loadData = useCallback(async () => {
    if (!uid) return;
    try {
      const [uRes, nRes] = await Promise.all([
        fetch(`${apiUrl}/api/user/${uid}`).then(r => r.json()),
        fetch(`${apiUrl}/api/notifications/${uid}`).then(r => r.json()),
      ]);
      setUserName(uRes.name || '');
      if (uRes.banned) {
        setBanned({ isBanned: true, reason: uRes.banReason || 'No reason provided' });
      }
      setNotifications(nRes.notifications || []);
      setUnreadCount((nRes.notifications || []).filter((n: Notification) => !n.readBy?.includes(uid!)).length);

      if (!activePopup) {
        const dismissed = JSON.parse(localStorage.getItem('dismissed_popups') || '[]');
        const pRes = await fetch(`${apiUrl}/api/admin/popups`);
        const pData = await pRes.json();
        const active = (pData.popups || []).find((p: { active: boolean; id: string }) => p.active && !dismissed.includes(p.id));
        if (active) setActivePopup(active);
      }
    } catch {}
  }, [uid, apiUrl, activePopup]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { const i = setInterval(loadData, 15000); return () => clearInterval(i); }, [loadData]);

  const logout = useCallback(async () => {
    const { getClientAuth } = await import('@/lib/firebase');
    const { signOut } = await import('firebase/auth');
    await signOut(getClientAuth());
    document.cookie = 'onc_uid=;path=/;max-age=0';
    localStorage.removeItem('onc_uid');
    router.push('/login');
  }, [router]);

  const handleAppeal = async () => {
    if (!appealReason.trim()) return;
    setAppealLoading(true);
    try {
      const res = await fetch('/api/ban-appeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, reason: appealReason }),
      });
      const data = await res.json();
      if (data.success) setAppealSent(true);
    } catch {} finally { setAppealLoading(false); }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#03040a' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(167,139,250,0.1)', borderTop: '3px solid #a78bfa', borderRadius: '50%', animation: 'userSpin 1s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase' as const, fontWeight: 700, fontFamily: INTER }}>Loading...</div>
          <style>{`@keyframes userSpin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  if (banned?.isBanned) {
    return (
      <div style={{ minHeight: '100vh', background: '#03040a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: INTER, backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.06) 0%, transparent 60%)' }}>
        <div style={{ width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 24, padding: '36px 28px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          </div>
          <div style={{ fontFamily: SG, fontSize: 20, fontWeight: 800, color: '#ef4444', marginBottom: 6 }}>Account Banned</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Your account has been suspended from the platform.</div>
          <div style={{ fontSize: 11, color: 'rgba(239,68,68,0.6)', marginBottom: 24, fontStyle: 'italic' }}>Reason: {banned.reason}</div>

          {!appealSent ? (
            <>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textAlign: 'left' }}>Why should we unban you?</div>
              <textarea
                value={appealReason}
                onChange={e => setAppealReason(e.target.value)}
                placeholder="Explain why your account should be unbanned..."
                style={{
                  width: '100%', minHeight: 80, padding: 14, borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)',
                  color: '#fff', fontSize: 12, outline: 'none', resize: 'vertical',
                  fontFamily: INTER, marginBottom: 14,
                }}
              />
              <button
                onClick={handleAppeal}
                disabled={appealLoading || !appealReason.trim()}
                style={{
                  width: '100%', padding: 14, borderRadius: 12, border: 'none',
                  background: appealReason.trim() ? 'linear-gradient(135deg, #a78bfa, #60a5fa)' : 'rgba(255,255,255,0.05)',
                  color: appealReason.trim() ? '#000' : 'rgba(255,255,255,0.3)',
                  fontWeight: 800, fontSize: 12, cursor: appealLoading ? 'not-allowed' : 'pointer',
                  fontFamily: INTER, opacity: appealLoading ? 0.5 : 1,
                }}
              >
                {appealLoading ? 'Submitting...' : 'Submit Appeal'}
              </button>
            </>
          ) : (
            <>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div style={{ fontFamily: SG, fontSize: 16, fontWeight: 700, color: '#22c55e', marginBottom: 6 }}>Appeal Submitted</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Our team will review it shortly.</div>
            </>
          )}

          <div onClick={logout} style={{ marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#a78bfa'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}>
            Logout
          </div>
        </div>
      </div>
    );
  }

  const sidebarWidth = 240;
  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const pageTitle = title || NAV_ITEMS.find(item => isActive(item.href))?.label || 'Dashboard';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #03040a; color: #fff; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.2); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(167,139,250,0.35); }
        @media (max-width: 768px) {
          .user-sidebar { transform: translateX(-100%) !important; }
          .user-sidebar.open { transform: translateX(0) !important; }
          .user-main { margin-left: 0 !important; }
          .user-topbar { left: 0 !important; }
        }
      `}</style>

      {/* Mobile overlay */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)', zIndex: 99,
          }}
          className="user-overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`user-sidebar${menuOpen ? ' open' : ''}`}
        style={{
          position: 'fixed', top: 0, left: 0, width: sidebarWidth, height: '100vh',
          background: '#080914', borderRight: '1px solid rgba(167,139,250,0.12)',
          display: 'flex', flexDirection: 'column', zIndex: 100,
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          overflowY: 'auto', overflowX: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '28px 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src="/omchyra-logo.png"
              alt="ONCHYRA"
              style={{ width: 38, height: 38, borderRadius: 10, objectFit: 'cover' }}
            />
            <div>
              <div style={{
                fontFamily: SG, fontSize: 18, fontWeight: 800,
                background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>ONCHYRA</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' as const, marginTop: 1 }}>User Panel</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 10, textDecoration: 'none',
                  color: active ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                  background: active ? 'rgba(167,139,250,0.08)' : 'transparent',
                  borderLeft: active ? '3px solid #a78bfa' : '3px solid transparent',
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  transition: 'all 0.15s ease', position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)';
                    (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.8)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                    (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.5)';
                  }
                }}
              >
                {active && (
                  <div style={{
                    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                    width: 3, height: '60%', borderRadius: '0 3px 3px 0',
                    background: 'linear-gradient(180deg, #a78bfa, #60a5fa)',
                  }} />
                )}
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px 8px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              padding: '10px 14px', border: 'none', borderRadius: 10,
              background: 'rgba(239,68,68,0.06)', color: '#ef4444',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s ease', fontFamily: INTER,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.12)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.06)'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div
        className="user-main"
        style={{
          marginLeft: sidebarWidth, minHeight: '100vh',
          background: '#03040a',
          transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Top bar */}
        <header
          className="user-topbar"
          style={{
            position: 'sticky', top: 0, left: sidebarWidth, right: 0,
            height: 64, background: 'rgba(3,4,10,0.85)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 28px', zIndex: 50,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Hamburger for mobile */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'none', background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 6, borderRadius: 8,
              }}
              className="user-hamburger"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h1 style={{
              fontFamily: SG, fontSize: 20, fontWeight: 700, letterSpacing: -0.3,
            }}>
              {pageTitle}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setNotiOpen(!notiOpen)}
                style={{
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', padding: 6, position: 'relative',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -2, right: -4, width: 16, height: 16,
                    borderRadius: '50%', background: '#ef4444', color: 'white',
                    fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', border: '2px solid #03040a',
                  }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>
              {notiOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute', top: 40, right: 0, width: 320, maxHeight: 400,
                    overflowY: 'auto', background: '#0b0d18',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
                    zIndex: 2000, boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                  }}
                >
                  <div style={{
                    padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                    fontFamily: SG, fontWeight: 700, fontSize: 13,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span>Notifications</span>
                    <Link href="/updates" onClick={() => setNotiOpen(false)} style={{ fontSize: 10, color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>View All</Link>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>No notifications</div>
                  ) : notifications.slice(0, 10).map(n => (
                    <div key={n.id} style={{
                      padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                      borderLeft: !n.readBy?.includes(uid!) ? '3px solid #a78bfa' : '3px solid transparent',
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{n.title}</div>
                      <div style={{ fontSize: 10, opacity: 0.4, marginTop: 2 }}>{n.message}</div>
                      <div style={{ fontSize: 8, opacity: 0.25, marginTop: 3 }}>{formatTimeAgo(n.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile */}
            <Link href="/profile" style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg,#a78bfa,#60a5fa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 12, color: '#000', textDecoration: 'none',
            }}>
              {(userName || 'U')[0].toUpperCase()}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main style={{ padding: '28px', width: '100%' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .user-overlay { display: block !important; }
          .user-hamburger { display: block !important; }
          .user-topbar { left: 0 !important; }
        }
      `}</style>

      {activePopup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 420, background: '#0d0e1a', border: `1px solid ${activePopup.color}30`, borderRadius: 24, padding: '32px 28px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${activePopup.color}, transparent)` }} />
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${activePopup.color}15`, border: `1px solid ${activePopup.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={activePopup.color} strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <div style={{ fontFamily: SG, fontSize: 18, fontWeight: 800, color: activePopup.color, marginBottom: 10 }}>{activePopup.title}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 22 }}>{activePopup.message}</div>
            <button onClick={() => {
              const dismissed = JSON.parse(localStorage.getItem('dismissed_popups') || '[]');
              dismissed.push(activePopup.id);
              localStorage.setItem('dismissed_popups', JSON.stringify(dismissed));
              setActivePopup(null);
            }} style={{
              width: '100%', padding: 14, borderRadius: 14, border: 'none',
              background: `linear-gradient(135deg, ${activePopup.color}, ${activePopup.color}99)`,
              color: '#000', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: INTER,
            }}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
