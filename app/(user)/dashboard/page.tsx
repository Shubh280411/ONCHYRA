'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl, formatTimeAgo, formatUSD } from '@/lib/utils';
import { User, Notification, LeaderboardEntry } from '@/types/index';

function getRankInfo(balance: number) {
  if (balance < 10) return { label: 'ONC ROOKIE', bg: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '#a78bfa' };
  if (balance < 50) return { label: 'ONC SHARK', bg: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '#60a5fa' };
  return { label: 'ONC WHALE', bg: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '#fbbf24' };
}

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

const Card = ({ children, style = {}, className = '' }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) => (
  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 28, padding: 25, position: 'relative', overflow: 'hidden', ...style }} className={className}>
    {children}
  </div>
);

const MiniCard = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 28, padding: '16px 10px', textAlign: 'center', ...style }}>
    {children}
  </div>
);

const SectionLabel = ({ children, color = 'rgba(255,255,255,0.35)' }: { children: React.ReactNode; color?: string }) => (
  <div style={{ fontSize: 7, opacity: 0.35, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 3, color }}>{children}</div>
);

const SectionValue = ({ children, color = '#fff', size = 16 }: { children: React.ReactNode; color?: string; size?: number }) => (
  <div style={{ fontWeight: 800, fontSize: size, color, fontFamily: SG }}>{children}</div>
);

export default function DashboardPage() {
  const { user, uid, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notiOpen, setNotiOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [miningTimeLeft, setMiningTimeLeft] = useState('');
  const [miningProgress, setMiningProgress] = useState(0);
  const [canClaim, setCanClaim] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const apiUrl = detectApiUrl();

  const logout = useCallback(async () => {
    const { getClientAuth } = await import('@/lib/firebase');
    const { signOut } = await import('firebase/auth');
    await signOut(getClientAuth());
    router.push('/login');
  }, [router]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!uid) return;
    const load = async () => {
      try {
        const [uRes, lbRes, nRes] = await Promise.all([
          fetch(`${apiUrl}/api/user/${uid}`).then(r => r.json()),
          fetch(`${apiUrl}/api/leaderboard?limit=3`).then(r => r.json()),
          fetch(`${apiUrl}/api/notifications/${uid}`).then(r => r.json()),
        ]);
        setUserData(uRes);
        setLeaderboard(lbRes.leaders || []);
        setNotifications(nRes.notifications || []);
        setUnreadCount((nRes.notifications || []).filter((n: Notification) => !n.readBy?.includes(uid!)).length);
      } catch { }
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [uid, apiUrl]);

  useEffect(() => {
    if (!userData) return;
    const updateMining = () => {
      const lastClaim = userData.lastClaim || 0;
      const now = Date.now();
      const claimInterval = 24 * 60 * 60 * 1000;
      const elapsed = now - lastClaim;
      if (elapsed >= claimInterval) {
        setCanClaim(true);
        setMiningTimeLeft('Ready to Claim!');
        setMiningProgress(100);
      } else {
        setCanClaim(false);
        const remaining = claimInterval - elapsed;
        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setMiningTimeLeft(`${h}h ${m}m ${s}s`);
        setMiningProgress((elapsed / claimInterval) * 100);
      }
    };
    updateMining();
    const t = setInterval(updateMining, 1000);
    return () => clearInterval(t);
  }, [userData]);

  const handleClaim = async () => {
    if (!uid || claiming) return;
    setClaiming(true);
    try {
      const res = await fetch(`${apiUrl}/api/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Claim failed');
      showToast('Mining rewards claimed!');
      const uRes = await fetch(`${apiUrl}/api/user/${uid}`).then(r => r.json());
      setUserData(uRes);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Claim failed', 'error');
    }
    setClaiming(false);
  };

  const handleCopyInvite = () => {
    if (!userData?.referralCode) return;
    navigator.clipboard.writeText(`https://onchyra.netlify.app/register?ref=${userData.referralCode}`);
    showToast('Link copied!');
  };

  if (authLoading || loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#03040a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
        <div style={{ width: 45, height: 45, border: '3px solid rgba(167,139,250,0.1)', borderTop: '3px solid #a78bfa', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ fontSize: 10, letterSpacing: 2, color: '#a78bfa', fontWeight: 800, textTransform: 'uppercase' as const, marginTop: 15 }}>Loading ONCHYRA...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!userData) return null;

  const rank = getRankInfo(userData.balance || 0);
  const dailyClaim = (0.05 * (userData.packageBoost || 1)).toFixed(3);
  const boost = userData.packageBoost || 1;
  const used = userData.packageUsage || 0;
  const maxCap = userData.packageCap || 0;
  const capPct = maxCap > 0 ? Math.min(100, (used / maxCap) * 100) : 0;

  return (
    <div style={{ fontFamily: INTER, background: '#03040a', color: 'white', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fire-glow{0%,100%{filter:drop-shadow(0 0 6px rgba(251,191,36,0.4))}50%{filter:drop-shadow(0 0 10px rgba(251,191,36,0.7))}}
      `}</style>
      {ToastComponent}

      {/* NAVBAR */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, padding: 15, background: 'linear-gradient(to bottom,#03040a 90%,transparent)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', background: 'rgba(255,255,255,0.03)', borderRadius: 22, border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(25px)' }}>
          <button onClick={() => setMenuOpen(true)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 16 }}>
            <span style={{ background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ONCHYRA</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setNotiOpen(!notiOpen)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4, position: 'relative' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {unreadCount > 0 && <span style={{ position: 'absolute', top: -2, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', color: 'white', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #03040a' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>
              {notiOpen && (
                <div style={{ position: 'absolute', top: 40, right: -60, width: 320, maxHeight: 400, overflowY: 'auto', background: '#0b0d18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, zIndex: 2000, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontFamily: SG, fontWeight: 700, fontSize: 14 }}>Notifications</span>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>No notifications</div>
                  ) : notifications.slice(0, 10).map(n => (
                    <div key={n.id} style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.03)', borderLeft: !n.readBy?.includes(uid!) ? '3px solid #a78bfa' : '3px solid transparent' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{n.title}</div>
                      <div style={{ fontSize: 11, opacity: 0.45, marginTop: 2 }}>{n.message}</div>
                      <div style={{ fontSize: 9, opacity: 0.3, marginTop: 4 }}>{formatTimeAgo(n.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Link href="/profile" style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, color: '#000', textDecoration: 'none' }}>
              {(userData.name || 'U')[0].toUpperCase()}
            </Link>
          </div>
        </div>
      </div>

      {/* SIDE MENU */}
      {menuOpen && <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1100, backdropFilter: 'blur(10px)' }} />}
      <div style={{ position: 'fixed', top: 0, left: menuOpen ? 0 : -280, width: 280, height: '100%', background: '#080914', padding: '30px 15px', transition: '0.4s cubic-bezier(0.4,0,0.2,1)', zIndex: 1200, borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 24, padding: '0 14px', marginBottom: 30 }}>
          <span style={{ background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ONCHYRA</span>
        </div>
        {[
          { href: '/dashboard', label: 'Dashboard', active: true, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
          { href: '/p2p-transfer', label: 'P2P Transfer', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg> },
          { href: '/referrals', label: 'Referrals', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
          { href: '/packages', label: 'Packages', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> },
          { href: '/income', label: 'Income', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
          { href: '/income', label: 'Leadership', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 8 5 9 7v2"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 16 5 15 7v2"/><path d="M4 22h16"/><path d="M10 22V8h4v14"/></svg> },
          { href: '/deposit', label: 'Deposit', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3h-8l-2 4h12z"/></svg> },
          { href: '/withdraw', label: 'Withdraw', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
          { href: '/contests', label: 'Contest', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> },
          { href: '/leaderboard', label: 'Leaderboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg> },
          { href: '/updates', label: 'Updates', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
          { href: '#tools', label: 'Tools', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
        ].map(item => (
          <Link key={item.label} href={item.href} onClick={(e) => { if (item.href === '#tools') { e.preventDefault(); showToast('Coming soon!'); } setMenuOpen(false); }} style={{ color: item.active ? '#a78bfa' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13, fontWeight: 600, padding: 14, borderRadius: 14, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 12, background: item.active ? 'rgba(167,139,250,0.1)' : 'none', cursor: 'pointer' }}>
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
        <div style={{ marginTop: 'auto', padding: '14px' }}>
          <button onClick={logout} style={{ width: '100%', padding: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, color: '#ef4444', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 15px 40px' }}>

        {/* BALANCE CARD */}
        <Card style={{ textAlign: 'center', position: 'relative', overflow: 'visible', background: 'linear-gradient(135deg,rgba(167,139,250,0.08),rgba(96,165,250,0.08))', border: '1px solid rgba(167,139,250,0.2)' }}>
          <div style={{ fontSize: 9, fontWeight: 900, padding: '4px 12px', borderRadius: 6, textTransform: 'uppercase' as const, letterSpacing: 1, display: 'inline-block', marginBottom: 10, background: rank.bg, color: rank.color, border: `1px solid ${rank.border}` }}>{rank.label}</div>
          <div style={{ fontSize: 10, opacity: 0.4, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, marginBottom: 4 }}>Total ONC Mined</div>
          <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 60, lineHeight: 1.1, margin: '5px 0' }}>{(userData.balance || 0).toFixed(2)} <span style={{ fontSize: 14, opacity: 0.4, fontWeight: 700 }}>ONC</span></div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '8px 18px', borderRadius: 30, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.6))' }}>
              <path d="M12 23c-4.97 0-9-3.58-9-8 0-3.07 2.25-5.74 3.84-7.54C8.29 5.86 9.5 4.2 9.5 2c0 0 1.5 1 3 3.5C14 8 15 10 15 12c0-1 1-3 3-4.5.5 1.5.5 3.5.5 5.5 0 5.52-2.91 10-6.5 10z" fill="#fbbf24" opacity="0.9"/>
              <path d="M12 20c-2.76 0-5-2.24-5-5 0-2.15 1.65-3.86 2.5-4.8.8-1.06 1.5-2.2 1.5-3.7 0 0 0.8 1.1 1.5 2.7.7 1.6 1.5 3.2 1.5 4.8 0-0.7 0.7-2 2.5-3.2.3 0.9.3 2 0.3 3.2 0 3.31-2.02 6-4.8 6z" fill="#f59e0b"/>
            </svg>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#fbbf24' }}>
              <span>{userData.streakDays || 0}</span> <span style={{ fontSize: 10, opacity: 0.6 }}>days</span>
            </span>
          </div>
        </Card>

        {/* MINI CARDS: Wallet, Daily Claim, Commission */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 18 }}>
          <MiniCard style={{ border: '1px solid rgba(34,197,94,0.15)', background: 'linear-gradient(180deg,rgba(34,197,94,0.04),transparent)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 6 }}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 10a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>
            <SectionLabel>Wallet</SectionLabel>
            <SectionValue color="#22c55e">{formatUSD(userData.walletBalance || 0)}</SectionValue>
            <Link href="/deposit" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 7, fontWeight: 800, padding: '5px 14px', borderRadius: 20, background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#000', textDecoration: 'none', letterSpacing: 0.5 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              DEPOSIT
            </Link>
          </MiniCard>
          <MiniCard style={{ border: '1px solid rgba(251,191,36,0.15)', background: 'linear-gradient(180deg,rgba(251,191,36,0.04),transparent)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 6 }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <SectionLabel>Daily Claim</SectionLabel>
            <SectionValue color="#fbbf24">{dailyClaim} ONC</SectionValue>
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>+{boost}x boost</div>
          </MiniCard>
          <MiniCard style={{ border: '1px solid rgba(239,68,68,0.15)', background: 'linear-gradient(180deg,rgba(239,68,68,0.04),transparent)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 6 }}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            <SectionLabel>Commission</SectionLabel>
            <SectionValue color="#ef4444">{formatUSD(userData.commissionBalance || 0)}</SectionValue>
            <Link href="/withdraw" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 7, fontWeight: 800, padding: '5px 14px', borderRadius: 20, background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', textDecoration: 'none', letterSpacing: 0.5 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              WITHDRAW
            </Link>
          </MiniCard>
        </div>

        {/* ACTIVE DIRECTS / TEAM BUSINESS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <Card style={{ textAlign: 'center', padding: '14px 10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 4 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <SectionLabel>Active Directs</SectionLabel>
            <div style={{ fontWeight: 800, fontSize: 22, fontFamily: SG }}>
              <span style={{ color: '#22c55e' }}>{userData.activeDirects || 0}</span>
              <span style={{ opacity: 0.3 }}>/</span>
              <span style={{ color: '#60a5fa' }}>{userData.totalDirects || 0}</span>
            </div>
          </Card>
          <Card style={{ textAlign: 'center', padding: '14px 10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 4 }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <SectionLabel>Team Business</SectionLabel>
            <SectionValue color="#f59e0b" size={18}>{formatUSD(userData.teamBiz || 0)}</SectionValue>
          </Card>
        </div>

        {/* MINING BOOST / RANK / PACKAGE */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 10 }}>
          <Card style={{ textAlign: 'center', padding: '12px 10px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 3 }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <SectionLabel>Mining Boost</SectionLabel>
            <SectionValue color="#22c55e" size={15}>{boost}x</SectionValue>
          </Card>
          <Card style={{ textAlign: 'center', padding: '12px 10px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 3 }}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 8 5 9 7v2"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 16 5 15 7v2"/><path d="M4 22h16"/><path d="M10 22V8h4v14"/><path d="M12 2v3"/></svg>
            <SectionLabel>Rank</SectionLabel>
            <SectionValue color="#fbbf24" size={15}>{userData.rank || '-'}</SectionValue>
          </Card>
          <Card style={{ textAlign: 'center', padding: '12px 10px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 3 }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            <SectionLabel>Package</SectionLabel>
            <SectionValue color="#a78bfa" size={15}>{userData.activePackage && userData.activePackage !== 'none' ? userData.activePackage : 'None'}</SectionValue>
            <span style={{ fontSize: 6, fontWeight: 700, padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginTop: 2, background: userData.activePackage && userData.activePackage !== 'none' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', color: userData.activePackage && userData.activePackage !== 'none' ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>
              {userData.activePackage && userData.activePackage !== 'none' ? 'Active' : 'None'}
            </span>
          </Card>
        </div>

        {/* MINING PROTOCOL */}
        <Card className="full-width" style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)' }}>Mining Protocol</span>
            <span style={{ fontSize: 8, fontWeight: 700, marginLeft: 'auto', background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '2px 8px', borderRadius: 5 }}>{boost}x Boost</span>
          </div>
          <div style={{ background: '#111', height: 8, borderRadius: 20, overflow: 'hidden', marginBottom: 18 }}>
            <div style={{ height: '100%', width: `${miningProgress}%`, background: 'linear-gradient(90deg,#a78bfa,#60a5fa,#22c55e)', transition: '1s linear' }} />
          </div>
          <button onClick={handleClaim} disabled={!canClaim || claiming} style={{ width: '100%', padding: 22, border: 'none', borderRadius: 22, background: canClaim ? 'linear-gradient(135deg,#a78bfa,#60a5fa)' : '#1a1a1a', color: canClaim ? '#000' : '#444', fontWeight: 900, fontSize: 16, cursor: canClaim ? 'pointer' : 'not-allowed', textTransform: 'uppercase' as const, fontFamily: SG }}>
            {claiming ? 'Claiming...' : canClaim ? 'CLAIM NOW' : miningTimeLeft}
          </button>
        </Card>

        {/* LEADERBOARD PREVIEW */}
        <Card className="full-width" style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <h3 style={{ fontSize: 13, fontFamily: SG, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
              TOP VALIDATORS
            </h3>
            <Link href="/leaderboard" style={{ fontSize: 10, fontWeight: 800, color: '#a78bfa', textDecoration: 'none', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', padding: '6px 14px', borderRadius: 20 }}>VIEW ALL</Link>
          </div>
          {leaderboard.map((l, i) => (
            <div key={l.uid} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 14, marginBottom: 8, fontSize: 11, border: '1px solid rgba(255,255,255,0.03)', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 900, fontSize: 12, color: i === 0 ? '#fbbf24' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'rgba(255,255,255,0.3)', width: 20, textAlign: 'center' }}>#{i + 1}</span>
                <span style={{ fontWeight: 700, color: 'white' }}>{l.name || 'Anonymous'}</span>
              </div>
              <span style={{ fontWeight: 800, color: '#22c55e' }}>{(l.balance || 0).toFixed(2)} ONC</span>
            </div>
          ))}
          {leaderboard.length === 0 && <div style={{ padding: 12, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>No data yet</div>}
        </Card>

        {/* LIVE ACTIVITY */}
        <Card className="full-width" style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <span style={{ fontSize: 12, fontWeight: 800 }}>LIVE ACTIVITY</span>
          </div>
          {leaderboard.length > 0 ? leaderboard.slice(0, 5).map((l, i) => (
            <div key={l.uid + i} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 14, marginBottom: 8, fontSize: 11, border: '1px solid rgba(255,255,255,0.03)', alignItems: 'center' }}>
              <span><b style={{ color: '#fff' }}>{l.name || 'Anonymous'}</b> <span style={{ opacity: 0.5, fontSize: 10 }}>synchronized</span></span>
              <span style={{ opacity: 0.5, fontSize: 10 }}>now</span>
            </div>
          )) : <div style={{ padding: 12, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>No activity yet</div>}
        </Card>

        {/* PROTOCOL UPDATE */}
        <Link href="/updates" style={{ display: 'block', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: '4px solid #a78bfa', borderRadius: 28, padding: 25, marginTop: 18, textDecoration: 'none', color: 'white', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#a78bfa', letterSpacing: 2 }}>PROTOCOL UPDATE</div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>
            {notifications.length > 0 ? notifications[0].title : 'No updates yet'}
          </div>
        </Link>

        {/* REFERRAL CODE */}
        <Card className="full-width" style={{ background: 'linear-gradient(135deg,rgba(167,139,250,0.08),rgba(96,165,250,0.06))', border: '1px solid rgba(167,139,250,0.25)', marginTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2 2"/><polyline points="22,6 12,13 2,6"/></svg>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#a78bfa', letterSpacing: 2, textTransform: 'uppercase' as const }}>Your Referral Code</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 15, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: SG, fontWeight: 900, color: '#fff', letterSpacing: 5, fontSize: 24 }}>{userData.referralCode || '...'}</div>
              <div style={{ fontSize: 10, opacity: 0.45, marginTop: 6 }}>Share &amp; earn bonus ONC for every friend who joins</div>
            </div>
            <button onClick={handleCopyInvite} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: 16, fontWeight: 900, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' as const, padding: '14px 24px' }}>INVITE</button>
          </div>
        </Card>

        {/* REFERRAL REWARDS HUB */}
        <Card className="full-width" style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)' }}>Referral Rewards Hub</span>
          </div>

          {[
            { level: 1, color: '#a78bfa', label: 'Direct Referrals', earned: (userData.refLevel1 || 0) * 0.25, team: userData.refLevel1 || 0, bg: 'rgba(167,139,250,' },
            { level: 2, color: '#60a5fa', label: 'Indirect Referrals', earned: (userData.refLevel2 || 0) * 0.10, team: userData.refLevel2 || 0, bg: 'rgba(96,165,250,' },
            { level: 3, color: '#fbbf24', label: 'Tier 3 Referrals', earned: (userData.refLevel3 || 0) * 0.05, team: userData.refLevel3 || 0, bg: 'rgba(251,191,36,' },
          ].map(tier => (
            <div key={tier.level} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '14px 18px', marginBottom: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                <svg viewBox="0 0 42 42" fill="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}><circle cx="21" cy="21" r="20" stroke={`${tier.bg}0.4)`} strokeWidth="1.5"/><circle cx="21" cy="21" r="16" fill={`${tier.bg}0.12)`}/><circle cx="21" cy="21" r="16" stroke={`${tier.bg}0.3)`} strokeWidth="1"/></svg>
                <span style={{ position: 'relative', zIndex: 1, fontFamily: SG, fontWeight: 900, fontSize: 16, color: '#fff' }}>{tier.level}</span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: SG, fontWeight: 800, fontSize: 13, letterSpacing: -0.2, color: tier.color }}>Level {tier.level}</div>
                <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.8, color: 'rgba(255,255,255,0.2)', marginTop: 1 }}>{tier.label}</div>
              </div>
              <div style={{ display: 'flex', gap: 18, marginLeft: 'auto', flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 15, lineHeight: 1.2, color: '#22c55e' }}>{tier.earned.toFixed(2)} ONC</div>
                  <div style={{ fontSize: 7, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>Earned</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 15, lineHeight: 1.2, color: '#60a5fa' }}>{tier.team}</div>
                  <div style={{ fontSize: 7, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>Members</div>
                </div>
              </div>
            </div>
          ))}
        </Card>

        {/* QUICK P2P SEND */}
        <Card className="full-width" style={{ marginTop: 18, border: '1px solid rgba(167,139,250,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontSize: 12, fontFamily: SG, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              Quick Send
            </h3>
            <Link href="/p2p-transfer" style={{ fontSize: 9, color: '#a78bfa', fontWeight: 700, textDecoration: 'none', letterSpacing: 0.5 }}>FULL VIEW</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Network ID</div>
              <input type="text" placeholder="Referral code" maxLength={12} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px', fontFamily: INTER, fontSize: 13, color: 'white', outline: 'none' }} />
            </div>
            <div>
              <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Amount</div>
              <input type="text" inputMode="decimal" placeholder="ONC" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px', fontFamily: INTER, fontSize: 13, color: 'white', outline: 'none' }} />
            </div>
          </div>
          <button style={{ width: '100%', padding: 14, border: 'none', borderRadius: 14, background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', color: '#000', fontFamily: SG, fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' as const, cursor: 'pointer' }}>
            Send ONC
          </button>
        </Card>

        {/* QUICK LINKS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
          {[
            { href: '/deposit', label: 'Deposit', color: '#22c55e', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3h-8l-2 4h12z"/></svg> },
            { href: '/packages', label: 'Packages', color: '#a78bfa', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> },
            { href: '/referrals', label: 'Referrals', color: '#60a5fa', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
            { href: '/leaderboard', label: 'Leaderboard', color: '#fbbf24', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg> },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '16px 14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, color: 'white' }}>
              {item.icon}
              <span style={{ fontWeight: 700, fontSize: 12 }}>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* FOOTER */}
        <div style={{ textAlign: 'center', padding: '40px 25px', marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontFamily: SG, fontSize: 32, fontWeight: 900, background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>ONCHYRA</div>
          <div style={{ fontSize: 10, opacity: 0.4, letterSpacing: 3, marginBottom: 6 }}>DECENTRALIZED VALIDATION NETWORK</div>
          <div style={{ fontSize: 10, opacity: 0.3, marginBottom: 24 }}>Mine The Future.</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
            <a href="https://t.me/onchyra" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#60a5fa"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.216s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </a>
            <a href="https://youtube.com/@onchyra" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ef4444"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
            <a href="https://instagram.com/onchyra" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="url(#igGrad)"><defs><linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#feda75"/><stop offset="25%" stopColor="#fa7e1e"/><stop offset="50%" stopColor="#d62976"/><stop offset="75%" stopColor="#962fbf"/><stop offset="100%" stopColor="#4f5bd5"/></linearGradient></defs><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
            </a>
          </div>
          <div style={{ width: 60, height: 1, background: 'linear-gradient(to right,transparent,#a78bfa,transparent)', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 9, opacity: 0.2, letterSpacing: 1 }}>&copy; 2026 ONCHYRA PROTOCOL &middot; ALL RIGHTS RESERVED</div>
        </div>
      </div>
    </div>
  );
}
