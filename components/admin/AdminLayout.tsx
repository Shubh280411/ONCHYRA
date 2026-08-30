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
  { href: '/admin/bans', label: 'Bans', icon: 'ban' },
  { href: '/admin/analytics', label: 'Analytics', icon: 'chart' },
  { href: '/admin/announcements', label: 'Announcements', icon: 'megaphone' },
  { href: '/admin/notifications', label: 'Notifications', icon: 'bell' },
  { href: '/admin/popups', label: 'Popups', icon: 'popup' },
  { href: '/admin/otps', label: 'OTPs', icon: 'lock' },
  { href: '/admin/emails', label: 'Email Extractor', icon: 'mail' },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: 'wallet' },
  { href: '/admin/p2p', label: 'P2P Transfers', icon: 'send' },
  { href: '/admin/leaders', label: 'Leader Management', icon: 'star' },
  { href: '/admin/updates', label: 'Updates', icon: 'newspaper' },
  { href: '/admin/deposits', label: 'Sweep', icon: 'coins' },
  { href: '/admin/onx-withdrawals', label: 'ONX Withdrawals', icon: 'onxwd' },
  { href: '/admin/packages', label: 'Packages', icon: 'box' },
  { href: '/admin/polls', label: 'Polls', icon: 'poll' },
  { href: '/admin/maintenance', label: 'Maintenance', icon: 'wrench' },
  { href: '/admin/support', label: 'Support', icon: 'chat' },
] as const;

function NavIcon({ icon, size = 18 }: { icon: string; size?: number }) {
  const s = { width: size, height: size, style: { flexShrink: 0 } };
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
    case 'newspaper':
      return <svg {...s} viewBox="0 0 24 24" {...base}><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" /><path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" /></svg>;
    case 'coins':
      return <svg {...s} viewBox="0 0 24 24" {...base}><circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18" /><path d="M7 6h1v4" /><path d="m16.71 13.88.7.71-2.82 2.82" /></svg>;
    case 'box':
      return <svg {...s} viewBox="0 0 24 24" {...base}><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>;
    case 'wrench':
      return <svg {...s} viewBox="0 0 24 24" {...base}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" /></svg>;
    case 'lock':
      return <svg {...s} viewBox="0 0 24 24" {...base}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
    case 'send':
      return <svg {...s} viewBox="0 0 24 24" {...base}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
    case 'megaphone':
      return <svg {...s} viewBox="0 0 24 24" {...base}><path d="M3 11l18-5v12L3 13v-2z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>;
    case 'ban':
      return <svg {...s} viewBox="0 0 24 24" {...base}><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>;
    case 'popup':
      return <svg {...s} viewBox="0 0 24 24" {...base}><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" /><path d="M9 10h6" /><path d="M12 7v6" /></svg>;
    case 'chat':
      return <svg {...s} viewBox="0 0 24 24" {...base}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
    case 'onxwd':
      return <svg {...s} viewBox="0 0 24 24" {...base}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
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

        .admin-overlay { display: none; }
        .admin-hamburger { display: none; }

        @media (max-width: 768px) {
          .admin-overlay { display: block !important; position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 99; }
          .admin-hamburger { display: flex !important; }
          .admin-sidebar { transform: translateX(-100%) !important; width: 260px !important; }
          .admin-sidebar.open { transform: translateX(0) !important; }
          .admin-main { margin-left: 0 !important; }
          .admin-main .adm-pad { padding: 14px !important; }
          .admin-topbar { left: 0 !important; right: 0 !important; height: 52px !important; padding: 0 14px !important; }
          .admin-topbar h1 { font-size: 15px !important; }
          .admin-email-badge { display: none !important; }
        }
        @media (min-width: 769px) {
          .admin-overlay { display: none !important; }
          .admin-hamburger { display: none !important; }
        }
      `}</style>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={`admin-sidebar${sidebarOpen ? ' open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 240,
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
        <div style={{ padding: '24px 16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/omchyra-logo.png" alt="ONCHYRA" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover' }} />
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 800, background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ONCHYRA
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' as const, marginTop: 1 }}>
                Admin Panel
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '10px 6px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  color: active ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                  background: active ? 'rgba(167,139,250,0.08)' : 'transparent',
                  borderLeft: active ? '3px solid #a78bfa' : '3px solid transparent',
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  transition: 'all 0.15s ease',
                }}
              >
                <NavIcon icon={item.icon} size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '10px 6px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '9px 12px', border: 'none', borderRadius: 8,
              background: 'rgba(239,68,68,0.06)', color: '#ef4444',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="admin-main" style={{ marginLeft: 240, minHeight: '100vh', background: '#05060f' }}>
        {/* Top bar */}
        <header className="admin-topbar" style={{
          position: 'sticky', top: 0, left: 240, right: 0, height: 64,
          background: 'rgba(5,6,15,0.85)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="admin-hamburger" style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer', padding: 6, borderRadius: 8,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: -0.3 }}>
              {title}
            </h1>
          </div>
          <div className="admin-email-badge" style={{
            padding: '4px 12px', borderRadius: 100, fontSize: 10, fontWeight: 600,
            background: 'rgba(167,139,250,0.08)', color: '#a78bfa',
            border: '1px solid rgba(167,139,250,0.12)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
            {adminEmail}
          </div>
        </header>

        {/* Page content */}
        <main className="adm-pad" style={{ padding: '24px' }}>
          {children}
        </main>
      </div>
    </>
  );
}
