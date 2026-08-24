'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl, formatTimeAgo } from '@/lib/utils';
import Loading from '@/components/ui/Loading';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

interface ClaimRecord {
  id: string;
  user_id: string;
  amount: number;
  streak_day: number;
  created_at: number;
}

interface UserData {
  streak: number;
  balance: number;
  lastClaim: number;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function StreaksPage() {
  const { uid } = useAuth();
  const { ToastComponent } = useToast();
  const apiUrl = detectApiUrl();

  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [streakRes, userRes] = await Promise.all([
        fetch(`${apiUrl}/api/streaks?uid=${uid}`),
        fetch(`${apiUrl}/api/user/${uid}`),
      ]);
      if (streakRes.ok) {
        const d = await streakRes.json();
        setClaims(d.claims || []);
      }
      if (userRes.ok) {
        const d = await userRes.json();
        setUserData({ streak: d.streak || 0, balance: d.balance || 0, lastClaim: d.lastClaim || 0 });
      }
    } catch {}
    setLoading(false);
  }, [apiUrl, uid]);

  useEffect(() => {
    if (!uid) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [uid, loadData]);

  const claimDays = useMemo(() => {
    const s = new Set<number>();
    for (const c of claims) {
      const d = new Date(c.created_at);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        s.add(d.getDate());
      }
    }
    return s;
  }, [claims, currentMonth, currentYear]);

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const cells: { day: number | null; claimed: boolean }[] = [];
    for (let i = 0; i < firstDay; i++) cells.push({ day: null, claimed: false });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, claimed: claimDays.has(d) });
    return cells;
  }, [claimDays, currentMonth, currentYear]);

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  }

  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  }

  const streak = userData?.streak || 0;

  const streakStats = [
    { label: 'Current Streak', value: `${streak}d`, color: '#fbbf24', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2"><path d="M12 2c-1 4-4 6-4 10a4 4 0 0 0 8 0c0-4-3-6-4-10z"/></svg> },
    { label: 'Total Claims', value: claims.length.toString(), color: '#a78bfa', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg> },
    { label: 'This Month', value: claimDays.size.toString(), color: '#60a5fa', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  ];

  if (loading) return <Loading text="Loading streaks..." />;

  return (
    <div style={{ fontFamily: INTER, background: '#03040a', color: 'white', minHeight: '100vh', padding: '16px', paddingBottom: 50, backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.08) 0%, transparent 60%)' }}>
      {ToastComponent}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingTop: 8 }}>
        <Link href="/dashboard" style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
          <svg width="17" height="17" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </Link>
        <div style={{ fontFamily: SG, fontSize: 15, fontWeight: 800, letterSpacing: 2, color: 'rgba(255,255,255,0.8)' }}>STREAKS</div>
        <div style={{ width: 38 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        {streakStats.map((s, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '16px 12px', textAlign: 'center', backdropFilter: 'blur(20px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontFamily: SG, fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const, letterSpacing: 1, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '20px 16px', marginBottom: 16, backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button onClick={prevMonth} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div style={{ fontFamily: SG, fontSize: 14, fontWeight: 800, letterSpacing: 1 }}>{monthName}</div>
          <button onClick={nextMonth} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {calendarDays.map((cell, i) => (
            <div key={i} style={{
              aspectRatio: '1',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 600,
              background: cell.claimed ? 'rgba(251,191,36,0.15)' : 'transparent',
              border: cell.claimed ? '1px solid rgba(251,191,36,0.3)' : '1px solid transparent',
              color: cell.claimed ? '#fbbf24' : cell.day ? 'rgba(255,255,255,0.25)' : 'transparent',
            }}>
              {cell.day || ''}
              {cell.day && (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="#fbbf24" style={{ position: 'absolute', top: 2, right: 2, display: cell.claimed ? 'block' : 'none' }}>
                  <path d="M12 2c-1 4-4 6-4 10a4 4 0 0 0 8 0c0-4-3-6-4-10z"/>
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '6px 18px', marginBottom: 16, backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Last Claim
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: userData?.lastClaim ? '#fbbf24' : 'rgba(255,255,255,0.3)' }}>
            {userData?.lastClaim ? formatTimeAgo(userData.lastClaim) : 'Never'}
          </span>
        </div>
      </div>

      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const, letterSpacing: 3, fontWeight: 700, marginBottom: 12 }}>Claim History</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
        {claims.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'rgba(255,255,255,0.2)', fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3 }}>
              <path d="M12 2c-1 4-4 6-4 10a4 4 0 0 0 8 0c0-4-3-6-4-10z"/>
            </svg>
            No claims yet
          </div>
        ) : (
          claims.slice(0, 30).map((claim) => (
            <div key={claim.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(251,191,36,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                  <path d="M12 2c-1 4-4 6-4 10a4 4 0 0 0 8 0c0-4-3-6-4-10z"/>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>Daily Claim</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Day {claim.streak_day} streak &middot; {formatTimeAgo(claim.created_at)}</div>
              </div>
              <div style={{ fontFamily: SG, fontSize: 13, fontWeight: 800, color: '#22c55e' }}>+{Number(claim.amount).toFixed(2)} ONC</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
