'use client';

import { useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { detectApiUrl } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: 'grid' },
  { href: '/admin/users', label: 'Users', icon: 'people' },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: 'wallet' },
  { href: '/admin/stats', label: 'Analytics', icon: 'chart' },
  { href: '/admin/campaign', label: 'Campaigns', icon: 'mail' },
  { href: '/admin/notifications', label: 'Notifications', icon: 'bell' },
  { href: '/admin/contest', label: 'Contests', icon: 'trophy' },
  { href: '/admin/predictions', label: 'Predictions', icon: 'trending' },
  { href: '/admin/polls', label: 'Polls', icon: 'poll' },
  { href: '/admin/leaders', label: 'Leader Management', icon: 'star' },
] as const;

function NavIcon({ icon, size = 18 }: { icon: string; size?: number }) {
  const s = { width: size, height: size, flexShrink: 0 };
  const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (icon) {
    case 'grid':
      return <svg {...s} viewBox="0 0 24 24" {...base}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
    case 'people':
      return <svg {...s} viewBox="0 0 24 24" {...base}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case 'wallet':
      return <svg {...s} viewBox="0 0 24 24" {...base}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 10H18a2 2 0 0 0 0 4h4" /><circle cx="17" cy="12" r="0.5" fill="currentColor" /></svg>;
    case 'chart':
      return <svg {...s} viewBox="0 0 24 24" {...base}><path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 5-9" /></svg>;
    case 'mail':
      return <svg {...s} viewBox="0 0 24 24" {...base}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" /></svg>;
    case 'bell':
      return <svg {...s} viewBox="0 0 24 24" {...base}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
    case 'trophy':
      return <svg {...s} viewBox="0 0 24 24" {...base}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>;
    case 'trending':
      return <svg {...s} viewBox="0 0 24 24" {...base}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>;
    case 'poll':
      return <svg {...s} viewBox="0 0 24 24" {...base}><rect x="3" y="12" width="4" height="9" rx="1" /><rect x="10" y="7" width="4" height="14" rx="1" /><rect x="17" y="3" width="4" height="18" rx="1" /></svg>;
    case 'star':
      return <svg {...s} viewBox="0 0 24 24" {...base}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
    default:
      return null;
  }
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { uid, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [adminEmail, setAdminEmail] = useState('Admin');
  const [verified, setVerified] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const verifyAdmin = useCallback(async (uidStr: string) => {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/check`, { headers: { 'x-auth-uid': uidStr } });
      if (!res.ok) { router.push('/admin/login'); return; }
      const data = await res.json();
      setAdminEmail(data.email || 'Admin');
      setVerified(true);
    } catch { router.push('/admin/login'); }
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    if (!uid) { router.push('/admin/login'); return; }
    verifyAdmin(uid);
  }, [uid, authLoading, verifyAdmin]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  function handleLogout() {
    import('firebase/auth').then(({ signOut }) => {
      import('@/lib/firebase').then(({ getClientAuth }) => {
        signOut(getClientAuth()).then(() => {
          document.cookie = 'onc_uid=;path=/;max-age=0';
          localStorage.removeItem('onc_uid');
          router.push('/admin/login');
        });
      });
    });
  }

  if (authLoading || !verified) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#05060f' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(167,139,250,0.1)', borderTop: '3px solid #a78bfa', borderRadius: '50%', animation: 'adminSpin 1s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase' as const, fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
            Loading admin panel...
          </div>
          <style>{`@keyframes adminSpin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const sidebarWidth = 240;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #05060f; color: #fff; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.2); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(167,139,250,0.35); }
        @media (max-width: 768px) {
          .admin-sidebar { transform: translateX(-100%) !important; }
          .admin-sidebar.open { transform: translateX(0) !important; }
          .admin-main { margin-left: 0 !important; }
          .admin-topbar { left: 0 !important; }
        }
      `}</style>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 99,
            display: 'none',
          }}
          className="admin-overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`admin-sidebar${sidebarOpen ? ' open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: sidebarWidth,
          height: '100vh',
          background: '#0a0b14',
          borderRight: '1px solid rgba(167,139,250,0.15)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '28px 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 900,
              fontSize: 15,
              color: '#000',
              letterSpacing: -0.5,
            }}>
              ON
            </div>
            <div>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: -0.5,
                background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                ONCHYRA
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' as const, marginTop: 1 }}>
                Admin Panel
              </div>
            </div>
          </div>
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  color: active ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                  background: active ? 'rgba(167,139,250,0.08)' : 'transparent',
                  borderLeft: active ? '3px solid #a78bfa' : '3px solid transparent',
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  transition: 'all 0.15s ease',
                  position: 'relative',
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
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: '60%',
                    borderRadius: '0 3px 3px 0',
                    background: 'linear-gradient(180deg, #a78bfa, #60a5fa)',
                  }} />
                )}
                <NavIcon icon={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px 8px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              padding: '10px 14px',
              border: 'none',
              borderRadius: 10,
              background: 'rgba(239,68,68,0.06)',
              color: '#ef4444',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.12)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.06)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
        className="admin-main"
        style={{
          marginLeft: sidebarWidth,
          minHeight: '100vh',
          background: '#05060f',
          transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Top bar */}
        <header
          className="admin-topbar"
          style={{
            position: 'sticky',
            top: 0,
            left: sidebarWidth,
            right: 0,
            height: 64,
            background: 'rgba(5,6,15,0.85)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
            zIndex: 50,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Hamburger for mobile */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 8,
              }}
              className="admin-hamburger"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: -0.3,
            }}>
              {title}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Admin email badge */}
            <div style={{
              padding: '5px 14px',
              borderRadius: 100,
              fontSize: 11,
              fontWeight: 600,
              background: 'rgba(167,139,250,0.08)',
              color: '#a78bfa',
              border: '1px solid rgba(167,139,250,0.12)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
              {adminEmail}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ padding: '28px' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .admin-overlay { display: block !important; }
          .admin-hamburger { display: block !important; }
          .admin-topbar { left: 0 !important; }
        }
      `}</style>
    </>
  );
}
