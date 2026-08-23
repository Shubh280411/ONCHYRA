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
  const [liveFeed, setLiveFeed] = useState<{ name: string; time: number }[]>([]);
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
          fetch(`${apiUrl}/api/leaderboard?limit=5`).then(r => r.json()),
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
      const res = await fetch(`${apiUrl}/api/user/${uid}`).then(r => r.json());
      setUserData(res);
      showToast('Mining rewards claimed!');
    } catch { showToast('Claim failed', 'error'); }
    setClaiming(false);
  };

  if (authLoading || loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#03040a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
        <div style={{ width: 45, height: 45, border: '3px solid rgba(167,139,250,0.1)', borderTop: '3px solid #a78bfa', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ fontSize: 10, letterSpacing: 2, color: '#a78bfa', fontWeight: 800, textTransform: 'uppercase', marginTop: 15 }}>Loading ONCHYRA...</div>
      </div>
    );
  }

  if (!userData) return null;

  const rank = getRankInfo(userData.balance || 0);
  const dailyClaim = (1 * (userData.packageBoost || 1)).toFixed(2);
  const boost = userData.packageBoost || 1;

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: '#03040a', color: 'white', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* NAVBAR */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, padding: 15 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', background: 'rgba(255,255,255,0.03)', borderRadius: 22, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(25px)' }}>
          <button onClick={() => setMenuOpen(true)} style={{ background: 'none', border: 'none', color: 'white', fontSize: 20, cursor: 'pointer', padding: 4 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 900, fontSize: 16 }}>
            <span style={{ background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ONCHYRA</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setNotiOpen(!notiOpen)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4, position: 'relative' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {unreadCount > 0 && <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', color: 'white', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>}
              </button>
              {notiOpen && (
                <div style={{ position: 'absolute', top: 40, right: 0, width: 300, maxHeight: 400, overflowY: 'auto', background: '#0a0b1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: 12, zIndex: 2000 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 8, color: 'rgba(255,255,255,0.5)' }}>NOTIFICATIONS</div>
                  {notifications.length === 0 ? <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 20 }}>No notifications</div> : notifications.slice(0, 10).map(n => (
                    <div key={n.id} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, marginBottom: 6, border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700 }}>{n.title}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{n.message}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>{formatTimeAgo(n.createdAt)}</div>
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
      <div style={{ position: 'fixed', top: 0, left: menuOpen ? 0 : -280, width: 280, height: '100%', background: '#080914', padding: '30px 15px', transition: '0.4s cubic-bezier(0.4,0,0.2,1)', zIndex: 1200, borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 900, fontSize: 18, marginBottom: 30, padding: '0 14px' }}>
          <span style={{ background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ONCHYRA</span>
        </div>
        {[
          { href: '/dashboard', label: 'Dashboard', icon: '🏠', active: true },
          { href: '/deposit', label: 'Deposit', icon: '💰' },
          { href: '/withdraw', label: 'Withdraw', icon: '💸' },
          { href: '/packages', label: 'Packages', icon: '📦' },
          { href: '/referrals', label: 'Referrals', icon: '👥' },
          { href: '/income', label: 'Income', icon: '📈' },
          { href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
          { href: '/contests', label: 'Contests', icon: '🎯', hot: true },
          { href: '/p2p-transfer', label: 'P2P Transfer', icon: '🔄' },
          { href: '/profile', label: 'Profile', icon: '👤' },
        ].map(item => (
          <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} style={{ color: item.active ? '#a78bfa' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13, fontWeight: 600, padding: 14, borderRadius: 14, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 12, background: item.active ? 'rgba(167,139,250,0.1)' : 'none', transition: '0.2s' }}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
            {item.hot && <span style={{ marginLeft: 'auto', fontSize: 8, fontWeight: 900, color: '#fbbf24', background: 'rgba(251,191,36,0.15)', padding: '2px 8px', borderRadius: 10 }}>HOT</span>}
          </Link>
        ))}
        <div style={{ marginTop: 'auto', padding: '14px' }}>
          <button onClick={logout} style={{ width: '100%', padding: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, color: '#ef4444', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 15px 40px' }}>
        {/* BALANCE CARD */}
        <div style={{ background: 'linear-gradient(135deg,rgba(167,139,250,0.08),rgba(96,165,250,0.08))', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 28, padding: '28px 24px', marginBottom: 18 }}>
          <div style={{ fontSize: 9, fontWeight: 900, padding: '4px 12px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: 1, display: 'inline-block', marginBottom: 10, background: rank.bg, color: rank.color, border: `1px solid ${rank.border}` }}>{rank.label}</div>
          <div style={{ fontSize: 10, opacity: 0.4, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Total ONC Mined</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 900, fontSize: 36, lineHeight: 1.1 }}>{(userData.balance || 0).toFixed(2)} <span style={{ fontSize: 14, opacity: 0.4, fontWeight: 700 }}>ONC</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 10, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24"><path d="M12 23c-4.97 0-9-3.58-9-8 0-3.07 2.25-5.74 3.84-7.54C8.29 5.86 9.5 4.2 9.5 2c0 0 1.5 1 3 3.5C14 8 15 10 15 12c0-1 1-3 3-4.5.5 1.5.5 3.5.5 5.5 0 5.52-2.91 10-6.5 10z"/></svg>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#fbbf24' }}>{userData.streakDays || 0} Day Streak</span>
            </div>
          </div>
        </div>

        {/* MINI CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
          <div style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 28, padding: '16px 10px', textAlign: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" style={{ marginBottom: 6 }}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3h-8l-2 4h12z"/></svg>
            <div style={{ fontSize: 7, opacity: 0.35, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>Wallet</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#22c55e', fontFamily: "'Space Grotesk',sans-serif" }}>{formatUSD(userData.walletBalance || 0)}</div>
          </div>
          <div style={{ border: '1px solid rgba(251,191,36,0.15)', borderRadius: 28, padding: '16px 10px', textAlign: 'center', overflow: 'hidden', background: 'linear-gradient(180deg,rgba(251,191,36,0.04),transparent)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" style={{ marginBottom: 6 }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <div style={{ fontSize: 7, opacity: 0.35, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>Daily Claim</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#fbbf24', fontFamily: "'Space Grotesk',sans-serif" }}>{dailyClaim} ONC</div>
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>+{boost}x boost</div>
          </div>
          <div style={{ border: '1px solid rgba(239,68,68,0.15)', borderRadius: 28, padding: '16px 10px', textAlign: 'center', overflow: 'hidden', background: 'linear-gradient(180deg,rgba(239,68,68,0.04),transparent)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ marginBottom: 6 }}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
            <div style={{ fontSize: 7, opacity: 0.35, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>Commission</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#ef4444', fontFamily: "'Space Grotesk',sans-serif" }}>{formatUSD(userData.commissionBalance || 0)}</div>
            <Link href="/withdraw" style={{ display: 'inline-block', marginTop: 4, fontSize: 7, fontWeight: 800, color: '#ef4444', textDecoration: 'none' }}>WITHDRAW →</Link>
          </div>
        </div>

        {/* ACTIVE DIRECTS / TEAM BIZ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, padding: '14px 10px', textAlign: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" style={{ marginBottom: 4 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <div style={{ fontSize: 7, opacity: 0.35, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Active Directs</div>
            <div style={{ fontWeight: 800, fontSize: 22, fontFamily: "'Space Grotesk',sans-serif" }}><span style={{ color: '#22c55e' }}>{userData.activeDirects || 0}</span><span style={{ opacity: 0.3 }}>/</span><span style={{ color: '#60a5fa' }}>{userData.totalDirects || 0}</span></div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, padding: '14px 10px', textAlign: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" style={{ marginBottom: 4 }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <div style={{ fontSize: 7, opacity: 0.35, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Team Business</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#f59e0b', fontFamily: "'Space Grotesk',sans-serif" }}>{formatUSD(userData.teamBiz || 0)}</div>
          </div>
        </div>

        {/* MINING BOOST / RANK / PACKAGE */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 18 }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 7, opacity: 0.35, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Mining Boost</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#a78bfa', fontFamily: "'Space Grotesk',sans-serif" }}>{boost}x</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 7, opacity: 0.35, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Rank</div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#60a5fa', fontFamily: "'Space Grotesk',sans-serif" }}>{userData.rank || 'Member'}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 7, opacity: 0.35, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Package</div>
            <div style={{ fontWeight: 800, fontSize: 14, color: userData.activePackage && userData.activePackage !== 'none' ? '#22c55e' : '#ef4444', fontFamily: "'Space Grotesk',sans-serif" }}>{userData.activePackage && userData.activePackage !== 'none' ? userData.activePackage : 'None'}</div>
          </div>
        </div>

        {/* MINING PROTOCOL */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, padding: 25, marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, color: 'rgba(255,255,255,0.5)' }}>Mining Protocol</div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>Claim your daily ONC rewards based on your package boost</div>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ height: '100%', width: `${miningProgress}%`, background: canClaim ? 'linear-gradient(90deg,#22c55e,#16a34a)' : 'linear-gradient(90deg,#a78bfa,#60a5fa)', borderRadius: 2, transition: 'width 1s linear' }} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: canClaim ? '#22c55e' : '#a78bfa', marginBottom: 16, textAlign: 'center' }}>{miningTimeLeft}</div>
          <button onClick={handleClaim} disabled={!canClaim || claiming} style={{ width: '100%', padding: 22, border: 'none', borderRadius: 22, background: canClaim ? 'linear-gradient(135deg,#a78bfa,#60a5fa)' : '#1a1a1a', color: canClaim ? '#000' : '#444', fontWeight: 900, fontSize: 16, cursor: canClaim ? 'pointer' : 'not-allowed', textTransform: 'uppercase', fontFamily: "'Space Grotesk',sans-serif" }}>
            {claiming ? 'Claiming...' : canClaim ? '⛏️ CLAIM NOW' : 'MINING...'}
          </button>
        </div>

        {/* LEADERBOARD */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, padding: 25, marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.5)' }}>Leaderboard</div>
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
        </div>

        {/* REFERRAL HUB */}
        <div style={{ background: 'linear-gradient(135deg,rgba(167,139,250,0.06),rgba(96,165,250,0.06))', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 28, padding: 25, marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14, color: 'rgba(255,255,255,0.5)' }}>Referral Rewards Hub</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 8, opacity: 0.4, fontWeight: 700 }}>L1 VANGUARD</div>
              <div style={{ fontWeight: 900, fontSize: 20, color: '#a78bfa', fontFamily: "'Space Grotesk',sans-serif" }}>{userData.refLevel1 || 0}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 8, opacity: 0.4, fontWeight: 700 }}>L2 GUARDIANS</div>
              <div style={{ fontWeight: 900, fontSize: 20, color: '#60a5fa', fontFamily: "'Space Grotesk',sans-serif" }}>{userData.refLevel2 || 0}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 8, opacity: 0.4, fontWeight: 700 }}>L3 SEEKERS</div>
              <div style={{ fontWeight: 900, fontSize: 20, color: '#22c55e', fontFamily: "'Space Grotesk',sans-serif" }}>{userData.refLevel3 || 0}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, fontWeight: 700, color: '#a78bfa' }}>{userData.referralCode || 'N/A'}</div>
            <button onClick={() => { navigator.clipboard.writeText(`https://onchyra.netlify.app/register?ref=${userData.referralCode}`); showToast('Link copied!'); }} style={{ background: 'white', color: '#000', border: 'none', borderRadius: 16, fontWeight: 900, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', padding: '14px 24px' }}>COPY LINK</button>
          </div>
        </div>

        {/* QUICK LINKS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
          {[
            { href: '/deposit', label: 'Deposit', color: '#22c55e', icon: '💰' },
            { href: '/packages', label: 'Packages', color: '#a78bfa', icon: '📦' },
            { href: '/referrals', label: 'Referrals', color: '#60a5fa', icon: '👥' },
            { href: '/leaderboard', label: 'Leaderboard', color: '#fbbf24', icon: '🏆' },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '16px 14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, color: 'white', transition: '0.2s' }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontWeight: 700, fontSize: 12 }}>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* FOOTER */}
        <div style={{ textAlign: 'center', padding: '30px 0 10px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 20 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 900, fontSize: 14, marginBottom: 8 }}>
            <span style={{ background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ONCHYRA</span>
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: 1 }}>Decentralised Mining Platform</div>
        </div>
      </div>
      {ToastComponent}
    </div>
  );
}
