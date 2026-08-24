'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl, formatUSD } from '@/lib/utils';

interface LeaderEntry {
  uid: string;
  name: string;
  balance: number;
  refLevel1: number;
  refLevel2: number;
  refLevel3: number;
  _rank: number;
}

const MEDAL_SVG = {
  gold: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="5" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
      <path d="M8 21l4-3 4 3V12H8v9z" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
    </svg>
  ),
  silver: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="5" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
      <path d="M8 21l4-3 4 3V12H8v9z" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
    </svg>
  ),
  bronze: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="5" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />
      <path d="M8 21l4-3 4 3V12H8v9z" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />
    </svg>
  ),
};

export default function LeaderboardPage() {
  const { uid } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const apiUrl = detectApiUrl();
  const myRankRef = useRef<HTMLDivElement | null>(null);

  const [topUsers, setTopUsers] = useState<LeaderEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myBalance, setMyBalance] = useState(0);
  const [search, setSearch] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [uid]);

  async function loadLeaderboard() {
    setLoading(true);
    try {
      const myUid = uid || '';
      const res = await fetch(`${apiUrl}/api/leaderboard?limit=100&myUid=${myUid}`);
      if (res.ok) {
        const d = await res.json();
        setTopUsers(d.topUsers || []);
        setMyRank(d.myRank || null);
        setMyBalance(Number(d.myBalance) || 0);
        setTotalUsers(d.totalUsers || 0);
      }
    } catch { /* silent */ }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return topUsers;
    const q = search.toLowerCase();
    return topUsers.filter(u => (u.name || '').toLowerCase().includes(q));
  }, [topUsers, search]);

  function scrollToMe() {
    myRankRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (loading) {
    return (
      <div style={{ fontFamily: "'Inter',sans-serif", background: '#05060f', color: 'white', padding: 15, overflowX: 'hidden', minHeight: '100vh' }}>
        <div style={{ position: 'fixed', top: '-10%', left: '-10%', width: '120%', height: '120%', background: 'radial-gradient(circle at 20% 30%, #6d28d933, transparent 40%),radial-gradient(circle at 80% 70%, #2563eb33, transparent 40%)', zIndex: -1 }} />
        <div style={{ maxWidth: 600, margin: '0 auto', paddingTop: 40, textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.05)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: '#05060f', color: 'white', padding: 15, overflowX: 'hidden', minHeight: '100vh', position: 'relative' }}>
      <div style={{ position: 'fixed', top: '-10%', left: '-10%', width: '120%', height: '120%', background: 'radial-gradient(circle at 20% 30%, #6d28d933, transparent 40%),radial-gradient(circle at 80% 70%, #2563eb33, transparent 40%)', zIndex: -1 }} />
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {ToastComponent}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5px', marginBottom: 10 }}>
          <Link href="/dashboard" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
            DASHBOARD
          </Link>
          <div style={{ fontFamily: "'Space Grotesk'", fontSize: 20, fontWeight: 800, letterSpacing: 1, color: 'white' }}>ONCHYRA</div>
        </div>

        {/* Rank Card */}
        <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #0f172a)', border: '1px solid rgba(167, 139, 250, 0.3)', borderRadius: 24, padding: 25, textAlign: 'center', marginBottom: 25, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden', transition: 'opacity 0.3s' }}>
          <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 60%)' }} />
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, opacity: 0.6, marginBottom: 8, position: 'relative', zIndex: 1 }}>Global Standing</div>
          <div style={{ fontFamily: "'Space Grotesk'", fontSize: 48, fontWeight: 800, color: 'white', lineHeight: 1, marginBottom: 10, position: 'relative', zIndex: 1 }}>
            {myRank ? `#${myRank.toLocaleString()}` : '--'}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '5px 15px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 6, position: 'relative', zIndex: 1 }}>
            <svg width="14" height="14" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            {formatUSD(myBalance)} ONC
          </div>
        </div>

        {/* List Container */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 28, padding: '20px 10px' }}>
          {/* List Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 15px 15px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: 15 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h3 style={{ fontFamily: "'Space Grotesk'", fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                Top Validators
              </h3>
              <span style={{ fontSize: 12, opacity: 0.5, display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="10" height="10" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                {totalUsers.toLocaleString()} Validators
              </span>
            </div>
          </div>

          {/* Search */}
          <div style={{ padding: '0 15px 15px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              </div>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name..."
                style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: 13, fontFamily: "'Inter'", outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#a78bfa'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; }}
              />
            </div>
          </div>

          {/* Leaderboard List */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', opacity: 0.3, fontSize: 13 }}>
              <svg width="32" height="32" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" viewBox="0 0 24 24" style={{ margin: '0 auto 12px' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              {search ? 'No validators match your search' : 'No validators found'}
            </div>
          ) : (
            <div style={{ padding: '0 5px' }}>
              {filtered.map(u => {
                const isMe = uid && u.uid === uid;
                const team = (u.refLevel1 || 0) + (u.refLevel2 || 0) + (u.refLevel3 || 0);

                let rankDisplay: React.ReactNode;
                if (u._rank === 1) rankDisplay = <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{MEDAL_SVG.gold}</div>;
                else if (u._rank === 2) rankDisplay = <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{MEDAL_SVG.silver}</div>;
                else if (u._rank === 3) rankDisplay = <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{MEDAL_SVG.bronze}</div>;
                else rankDisplay = <div style={{ width: 40, fontWeight: 800, fontFamily: "'Space Grotesk'", fontSize: 16, color: 'rgba(255,255,255,0.3)', textAlign: 'center', flexShrink: 0 }}>{u._rank < 10 ? `0${u._rank}` : u._rank}</div>;

                return (
                  <div
                    key={u.uid}
                    ref={isMe ? myRankRef : undefined}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 15px', marginBottom: 10, borderRadius: 18,
                      background: isMe ? 'rgba(167, 139, 250, 0.08)' : 'rgba(255,255,255,0.02)',
                      border: isMe ? '1px solid #a78bfa' : '1px solid transparent',
                      transition: 'background 0.2s',
                    }}
                  >
                    {rankDisplay}
                    <div style={{ flex: 1, marginLeft: 10, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name || 'Anonymous Miner'}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        Team: {team}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 800, fontSize: 16, color: '#fff' }}>{(u.balance || 0).toFixed(2)}</div>
                      <div style={{ fontSize: 9, opacity: 0.4, fontWeight: 700 }}>ONC</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Scroll to me */}
          {myRank && myRank > 10 && (
            <div style={{ textAlign: 'center', padding: '10px 0 5px' }}>
              <button
                onClick={scrollToMe}
                style={{
                  padding: '8px 20px', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 100,
                  background: 'rgba(167,139,250,0.1)', color: '#a78bfa', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', transition: '0.2s', display: 'inline-flex', alignItems: 'center', gap: 6
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.1)'; }}
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 16 12 12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                Scroll to my rank
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
