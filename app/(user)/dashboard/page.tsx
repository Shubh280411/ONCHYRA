'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl, formatTimeAgo, formatUSD } from '@/lib/utils';
import { User, LeaderboardEntry } from '@/types/index';
import Footer from '@/components/user/Footer';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

function getRankInfo(balance: number) {
  if (balance < 10) return { label: 'ROOKIE', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: '1' };
  if (balance < 50) return { label: 'SHARK', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', icon: '2' };
  if (balance < 500) return { label: 'WHALE', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', icon: '3' };
  return { label: 'TITAN', color: '#f43f5e', bg: 'rgba(244,63,94,0.12)', icon: '4' };
}

export default function DashboardPage() {
  const { uid } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [miningTimeLeft, setMiningTimeLeft] = useState('');
  const [miningProgress, setMiningProgress] = useState(0);
  const [canClaim, setCanClaim] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [recentJoinings, setRecentJoinings] = useState<{ name: string; createdAt: number; flag: string; countryName: string }[]>([]);
  const [roiData, setRoiData] = useState<{ active: boolean; dailyRoi: number; totalRoi: number; totalClaimed: number; remainingDays: number; daysCompleted: number; nextClaimAvailable: boolean; packageId: string } | null>(null);
  const [roiEnabled, setRoiEnabled] = useState(true);
  const [utcTimer, setUtcTimer] = useState('');
  const [polls, setPolls] = useState<{ id: string; question: string; options: string[]; results: Record<string, number>; voted?: string }[]>([]);
  const [votingPollId, setVotingPollId] = useState<string | null>(null);
  const apiUrl = detectApiUrl();

  useEffect(() => {
    if (!uid) return;
    const load = async () => {
      try {
        const [uRes, lbRes, rjRes, pollsRes] = await Promise.all([
          fetch(`${apiUrl}/api/user/${uid}`).then(r => r.json()),
          fetch(`${apiUrl}/api/leaderboard?limit=3`).then(r => r.json()),
          fetch(`${apiUrl}/api/recent-joinings`).then(r => r.json()),
          fetch(`${apiUrl}/api/polls?uid=${uid}`).then(r => r.json()),
        ]);
        setUserData(uRes);
        setLeaderboard(lbRes.leaders || []);
        setRecentJoinings(Array.isArray(rjRes) ? rjRes : []);
        setRoiEnabled(uRes.roiEnabled === true);
        const pollsList = Array.isArray(pollsRes?.polls) ? pollsRes.polls.map((p: Record<string, unknown>) => ({
          id: String(p.id || ''),
          question: String(p.question || ''),
          options: Array.isArray(p.options) ? p.options as string[] : [],
          results: (p.results as Record<string, number>) || {},
          voted: (p.voted as string) || undefined,
        })) : [];
        setPolls(pollsList);

        // Auto-credit ROI at 12:00 UTC
        try {
          await fetch(`${apiUrl}/api/cron/roi-daily`);
        } catch {}

        // Fetch ROI status
        try {
          const roiRes = await fetch(`${apiUrl}/api/roi/status/${uid}`);
          if (roiRes.ok) {
            const roi = await roiRes.json();
            setRoiData(roi);
          }
        } catch {}
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

  // UTC 12:00 Countdown Timer
  useEffect(() => {
    const updateUtc = () => {
      const now = new Date();
      const utcH = now.getUTCHours();
      const utcM = now.getUTCMinutes();
      const utcS = now.getUTCSeconds();
      const secsLeft = ((24 - utcH - 1) * 3600) + ((60 - utcM - 1) * 60) + (60 - utcS);
      const h = Math.floor(secsLeft / 3600);
      const m = Math.floor((secsLeft % 3600) / 60);
      const s = secsLeft % 60;
      setUtcTimer(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    updateUtc();
    const t = setInterval(updateUtc, 1000);
    return () => clearInterval(t);
  }, []);

  async function handleVote(pollId: string, choice: string) {
    if (!uid || votingPollId) return;
    setVotingPollId(pollId);
    try {
      const res = await fetch(`${apiUrl}/api/polls/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, poll_id: pollId, choice }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Already voted', 'error'); return; }
      showToast('Vote recorded!');
      setPolls(prev => prev.map(p => {
        if (p.id !== pollId) return p;
        return { ...p, results: { ...p.results, [choice]: (p.results[choice] || 0) + 1 }, voted: choice };
      }));
    } catch { showToast('Vote failed', 'error'); }
    setVotingPollId(null);
  }

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
    navigator.clipboard.writeText(`https://app.onchyra.online/register?ref=${userData.referralCode}`);
    showToast('Link copied!');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: 44, height: 44, border: '3px solid rgba(167,139,250,0.1)', borderTop: '3px solid #a78bfa', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ fontFamily: SG, fontSize: 11, letterSpacing: 2, color: '#a78bfa', fontWeight: 800, textTransform: 'uppercase' as const, marginTop: 16 }}>Loading ONCHYRA</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!userData) return null;

  const rank = getRankInfo(userData.balance || 0);
  const boost = userData.packageBoost || 1;
  const dailyClaim = (0.05 * boost).toFixed(2);
  const used = userData.packageUsage || 0;
  const maxCap = userData.packageCap || 0;
  const capPct = maxCap > 0 ? Math.min(100, (used / maxCap) * 100) : 0;
  const CIRCUM = 2 * Math.PI * 34;

  return (
    <div style={{ fontFamily: INTER }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(167,139,250,0.15)}50%{box-shadow:0 0 40px rgba(167,139,250,0.25)}}
        .dash-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .dash-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        .dash-grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
        .dash-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .dash-side{display:grid;grid-template-columns:1.2fr 0.8fr;gap:14px}
        @media(max-width:768px){
          .dash-grid-2,.dash-grid-3,.dash-grid-4{grid-template-columns:1fr 1fr}
          .dash-row,.dash-side{grid-template-columns:1fr}
        }
        @media(max-width:480px){
          .dash-grid-2,.dash-grid-3,.dash-grid-4{grid-template-columns:1fr}
        }
      `}</style>
      {ToastComponent}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* BALANCE HERO CARD */}
        <div style={{ background: 'linear-gradient(145deg,rgba(167,139,250,0.12),rgba(96,165,250,0.08),rgba(34,197,94,0.04))', border: '1px solid rgba(167,139,250,0.18)', borderRadius: 24, padding: '28px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden', animation: 'glow 4s ease-in-out infinite' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,rgba(167,139,250,0.15),transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(96,165,250,0.1),transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 20, background: rank.bg, border: `1px solid ${rank.color}30`, marginBottom: 14 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={rank.color} strokeWidth="2" strokeLinecap="round"><path d="M12 2l2.4 5.2L20 8l-4 4.5L17 19l-5-3-5 3 1-6.5L4 8l5.6-.8L12 2z"/></svg>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: rank.color }}>{rank.label}</span>
          </div>

          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const, marginBottom: 6 }}>Total ONC Mined</div>
          <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 52, lineHeight: 1, position: 'relative' }}>
            <span style={{ background: 'linear-gradient(135deg,#fff 40%,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{(userData.balance || 0).toFixed(2)}</span>
            <span style={{ fontSize: 14, opacity: 0.35, fontWeight: 700, marginLeft: 4 }}>ONC</span>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '6px 16px', borderRadius: 20, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.12)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#fbbf24" opacity="0.8"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#fbbf24' }}>{userData.streakDays || 0}</span>
            <span style={{ fontSize: 9, opacity: 0.5, fontWeight: 600 }}>day streak</span>
          </div>
        </div>

        {/* QUICK STATS ROW */}
        <div className="dash-grid-3">
          {[
            { label: 'Wallet', value: formatUSD(userData.walletBalance || 0), color: '#22c55e', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 10a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg> },
            { label: 'Daily', value: `${dailyClaim}`, color: '#fbbf24', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
            { label: 'Commission', value: formatUSD(userData.commissionBalance || 0), color: '#ec4899', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '14px 10px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 15, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ONX TOKEN CARD */}
        <div style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.08),rgba(96,165,250,0.05),rgba(139,92,246,0.03))', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 20, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(96,165,250,0.15))', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            <img src="/ONX-logo.png" alt="ONX" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 2 }}>ONX Token Balance</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: SG, fontWeight: 900, fontSize: 22, color: '#8b5cf6' }}>{(userData.onxBalance || 0).toFixed(2)}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(139,92,246,0.5)' }}>ONX</span>
            </div>
          </div>
          <Link href="/onx-withdrawal" style={{ background: 'linear-gradient(135deg,#8b5cf6,#60a5fa)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 10, cursor: 'pointer', padding: '10px 18px', letterSpacing: 0.5, textDecoration: 'none', flexShrink: 0 }}>
            WITHDRAW
          </Link>
        </div>

        {/* TEAM STATS */}
        <div className="dash-grid-2">
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(96,165,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>Active Directs</div>
              <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 18 }}>
                <span style={{ color: '#22c55e' }}>{userData.activeDirects || 0}</span>
                <span style={{ opacity: 0.2, margin: '0 3px' }}>/</span>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>{userData.totalDirects || 0}</span>
              </div>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>Team Business</div>
              <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 18, color: '#f59e0b' }}>{formatUSD(userData.teamBiz || 0)}</div>
            </div>
          </div>
        </div>

        {/* PACKAGE INFO */}
        {userData.activePackage && userData.activePackage !== 'none' && (
          <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.12)', borderRadius: 18, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: SG, fontWeight: 800, fontSize: 14, textTransform: 'capitalize' as const }}>{userData.activePackage}</span>
                <span style={{ fontSize: 7, fontWeight: 800, padding: '2px 7px', borderRadius: 5, background: 'rgba(34,197,94,0.12)', color: '#22c55e', letterSpacing: 0.5 }}>ACTIVE</span>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
                Boost: <span style={{ color: '#22c55e', fontWeight: 700 }}>{boost}x</span> &middot; Cap: <span style={{ color: 'rgba(255,255,255,0.5)' }}>{capPct.toFixed(0)}% used</span>
              </div>
            </div>
            <svg width="56" height="56" viewBox="0 0 80 80" style={{ flexShrink: 0 }}>
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
              <circle cx="40" cy="40" r="34" fill="none" strokeWidth="5" strokeLinecap="round" strokeDasharray={CIRCUM} strokeDashoffset={CIRCUM - (capPct / 100) * CIRCUM} transform="rotate(-90 40 40)" style={{ stroke: capPct > 80 ? '#ef4444' : capPct > 50 ? '#f59e0b' : '#22c55e', transition: '0.8s' }} />
              <text x="40" y="37" textAnchor="middle" fontSize="14" fontWeight="900" fontFamily={SG} fill="white">{Math.round(capPct)}%</text>
              <text x="40" y="50" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.25)" fontWeight="600">Cap</text>
            </svg>
          </div>
        )}

        {/* ROI SECTION */}
        {roiData && roiData.active && roiEnabled && (
          <div style={{ background: 'linear-gradient(135deg,rgba(34,197,94,0.08),rgba(96,165,250,0.05))', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 20, padding: '18px 18px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const }}>Daily ROI</span>
              <span style={{ fontSize: 8, fontWeight: 700, marginLeft: 'auto', padding: '3px 10px', borderRadius: 8, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.15)' }}>AUTO CREDIT</span>
            </div>

            {/* UTC Countdown Timer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', marginBottom: 14, background: 'rgba(0,0,0,0.2)', borderRadius: 12 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5 }}>Next ROI in</span>
              <span style={{ fontFamily: SG, fontWeight: 900, fontSize: 18, color: '#fbbf24', letterSpacing: 2 }}>{utcTimer}</span>
            </div>

            <div className="dash-grid-3" style={{ marginBottom: 14 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>Daily</div>
                <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 16, color: '#22c55e' }}>{roiData.dailyRoi.toFixed(2)}</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>${roiData.dailyRoi.toFixed(2)} / day</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>Earned</div>
                <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 16, color: '#60a5fa' }}>{roiData.totalClaimed.toFixed(2)}</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>${roiData.totalClaimed.toFixed(2)} / ${roiData.totalRoi.toFixed(2)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>Days</div>
                <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 16, color: '#fbbf24' }}>{roiData.daysCompleted}</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>/ {roiData.daysCompleted + roiData.remainingDays}</div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', height: 6, borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${roiData.daysCompleted + roiData.remainingDays > 0 ? (roiData.daysCompleted / (roiData.daysCompleted + roiData.remainingDays)) * 100 : 0}%`, background: 'linear-gradient(90deg,#22c55e,#4ade80)', borderRadius: 20, transition: '0.8s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>{roiData.daysCompleted} days completed</span>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>{roiData.remainingDays} remaining</span>
            </div>
          </div>
        )}

        {/* ROI OFF MESSAGE */}
        {roiData && roiData.active && !roiEnabled && (
          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 20, padding: '20px 18px', textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            </div>
            <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 14, color: '#ef4444', marginBottom: 4 }}>Your ROI is OFF</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>Daily ROI auto-credit is currently disabled for your account. Contact admin to enable it.</div>
          </div>
        )}

        {/* MINING CLAIM */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 22, padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: canClaim ? 'radial-gradient(circle,rgba(34,197,94,0.15),transparent)' : 'radial-gradient(circle,rgba(167,139,250,0.1),transparent)', pointerEvents: 'none', transition: '0.5s' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, position: 'relative' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: canClaim ? '#22c55e' : '#a78bfa', animation: canClaim ? 'pulse 1.5s infinite' : 'none' }} />
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const }}>Mining Protocol</span>
            <span style={{ fontSize: 8, fontWeight: 700, marginLeft: 'auto', padding: '3px 10px', borderRadius: 8, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.15)' }}>{boost}x Boost</span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', height: 6, borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ height: '100%', width: `${miningProgress}%`, background: canClaim ? 'linear-gradient(90deg,#22c55e,#4ade80)' : 'linear-gradient(90deg,#a78bfa,#60a5fa)', borderRadius: 20, transition: '1s linear' }} />
          </div>

          <button onClick={handleClaim} disabled={!canClaim || claiming} style={{
            width: '100%', padding: 18, borderRadius: 16,
            background: canClaim ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'rgba(255,255,255,0.04)',
            color: canClaim ? '#000' : 'rgba(255,255,255,0.25)',
            fontWeight: 900, fontSize: 15, fontFamily: SG, letterSpacing: 0.5,
            cursor: canClaim && !claiming ? 'pointer' : 'not-allowed',
            transition: '0.3s', border: canClaim ? 'none' : '1px solid rgba(255,255,255,0.06)',
          }}>
            {claiming ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                Claiming...
              </span>
            ) : canClaim ? 'CLAIM NOW' : miningTimeLeft}
          </button>
        </div>

        {/* QUICK ACTIONS */}
        <div className="dash-grid-3">
          {[
            { href: '/deposit', label: 'Deposit', color: '#22c55e', bg: 'rgba(34,197,94,0.08)', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3h-8l-2 4h12z"/></svg> },
            { href: '/packages', label: 'Packages', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
            { href: '/withdraw', label: 'Withdraw', color: '#ec4899', bg: 'rgba(236,72,153,0.08)', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
          ].map((item, i) => (
            <Link key={i} href={item.href} style={{ background: item.bg, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '14px 8px', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'white', transition: '0.2s' }}>
              {item.icon}
              <span style={{ fontWeight: 700, fontSize: 10, color: item.color }}>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* REFERRAL CODE */}
        <div style={{ background: 'linear-gradient(135deg,rgba(167,139,250,0.08),rgba(96,165,250,0.05))', border: '1px solid rgba(167,139,250,0.18)', borderRadius: 20, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(167,139,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 7, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, textTransform: 'uppercase' as const, marginBottom: 3 }}>Referral Code</div>
            <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 18, letterSpacing: 3, color: 'white' }}>{userData.referralCode || '...'}</div>
          </div>
          <button onClick={handleCopyInvite} style={{ background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', color: '#000', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 10, cursor: 'pointer', padding: '10px 16px', letterSpacing: 0.5, flexShrink: 0 }}>
            COPY
          </button>
        </div>

        {/* LEADERBOARD */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '18px 18px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const }}>Top Validators</span>
            </div>
            <Link href="/leaderboard" style={{ fontSize: 9, fontWeight: 700, color: '#a78bfa', textDecoration: 'none', padding: '4px 12px', borderRadius: 8, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.15)' }}>VIEW ALL</Link>
          </div>
          {leaderboard.map((l, i) => (
            <div key={l.uid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < leaderboard.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: i === 0 ? 'rgba(251,191,36,0.12)' : i === 1 ? 'rgba(192,192,192,0.1)' : i === 2 ? 'rgba(205,127,50,0.1)' : 'rgba(255,255,255,0.04)', fontFamily: SG, fontWeight: 900, fontSize: 11, color: i === 0 ? '#fbbf24' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'rgba(255,255,255,0.3)' }}>
                {i + 1}
              </div>
              <span style={{ flex: 1, fontWeight: 600, fontSize: 12 }}>{l.name || 'Anonymous'}</span>
              <span style={{ fontFamily: SG, fontWeight: 900, fontSize: 12, color: '#22c55e' }}>{(l.balance || 0).toFixed(2)} <span style={{ fontSize: 9, opacity: 0.5 }}>ONC</span></span>
            </div>
          ))}
          {leaderboard.length === 0 && <div style={{ padding: 16, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>No data yet</div>}
        </div>

        {/* REFERRAL + ACTIVITY SIDE BY SIDE */}
        <div className="dash-row">
          {/* REFERRAL REWARDS */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '18px 18px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const }}>Referral Rewards</span>
            </div>
            {[
              { level: 1, color: '#a78bfa', count: userData.refLevel1 || 0, earned: `${((userData.refLevel1 || 0) * 0.10).toFixed(2)} ONC`, label: 'Direct', pct: '10%' },
              { level: 2, color: '#60a5fa', count: userData.refLevel2 || 0, earned: `${((userData.refLevel2 || 0) * 0.05).toFixed(2)} ONC`, label: 'Indirect', pct: '5%' },
              { level: 3, color: '#fbbf24', count: userData.refLevel3 || 0, earned: `${((userData.refLevel3 || 0) * 0.03).toFixed(2)} ONC`, label: 'Tier 3', pct: '3%' },
            ].map(tier => (
              <div key={tier.level} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: tier.level < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `${tier.color}15`, border: `1px solid ${tier.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: SG, fontWeight: 900, fontSize: 13, color: tier.color }}>
                  {tier.level}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: SG, fontWeight: 700, fontSize: 12, color: tier.color }}>{tier.label}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{tier.count} members &middot; {tier.pct} commission</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 13, color: '#22c55e' }}>{tier.earned}</div>
                </div>
              </div>
            ))}
          </div>

          {/* LIVE ACTIVITY */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '18px 18px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const }}>Recent Joinings</span>
            </div>
            {recentJoinings.length > 0 ? recentJoinings.slice(0, 5).map((j, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < recentJoinings.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ width: 30, height: 30, borderRadius: 10, background: 'linear-gradient(135deg,rgba(34,197,94,0.15),rgba(96,165,250,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 800, color: '#22c55e' }}>
                  {(j.name || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.name || 'New User'}</span>
                    {j.flag && <span style={{ fontSize: 12, lineHeight: 1 }}>{j.flag}</span>}
                  </div>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>joined{j.countryName ? ` from ${j.countryName}` : ''}</span>
                </div>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>{j.createdAt ? formatTimeAgo(j.createdAt) : ''}</span>
              </div>
            )) : <div style={{ padding: 16, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>No recent activity</div>}
          </div>
        </div>

        {/* POLLS */}
        {polls.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '18px 18px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const }}>Community Polls</span>
            </div>
            {polls.slice(0, 2).map((poll) => {
              const total = Object.values(poll.results).reduce((a, b) => a + b, 0);
              const voted = poll.voted;
              return (
                <div key={poll.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px 16px', marginBottom: 10 }}>
                  <div style={{ fontFamily: SG, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>{poll.question}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {poll.options.map((opt) => {
                      const count = poll.results[opt] || 0;
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      const isSelected = voted === opt;
                      return (
                        <button key={opt} disabled={!!voted} onClick={() => handleVote(poll.id, opt)} style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: isSelected ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.05)', background: isSelected ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.02)', cursor: voted ? 'default' : 'pointer', width: '100%', textAlign: 'left', transition: 'all .2s', position: 'relative', overflow: 'hidden',
                        }}>
                          {voted && (
                            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${pct}%`, background: isSelected ? 'rgba(34,197,94,0.06)' : 'rgba(167,139,250,0.04)', borderRadius: 10, transition: '0.5s' }} />
                          )}
                          <span style={{ flex: 1, fontSize: 12, color: isSelected ? '#22c55e' : 'rgba(255,255,255,0.6)', fontWeight: isSelected ? 700 : 500, position: 'relative', zIndex: 1 }}>{opt}</span>
                          {voted && <span style={{ fontSize: 11, fontWeight: 800, color: isSelected ? '#22c55e' : 'rgba(255,255,255,0.3)', position: 'relative', zIndex: 1 }}>{pct}%</span>}
                        </button>
                      );
                    })}
                  </div>
                  {total > 0 && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 8 }}>{total} vote{total !== 1 ? 's' : ''}</div>}
                </div>
              );
            })}
          </div>
        )}

        <Footer />

      </div>
    </div>
  );
}
