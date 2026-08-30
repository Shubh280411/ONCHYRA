'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl } from '@/lib/utils';
import Loading from '@/components/ui/Loading';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

interface Contest {
  id: string;
  name: string;
  description: string;
  active: boolean;
  endTime: number;
  prizes?: { rank: number; amount: string }[];
}

function formatTimeLeft(endTime: number) {
  const diff = endTime - Date.now();
  if (diff <= 0) return 'ENDED';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const prizeColors = ['#ffd700', '#c0c0c0', '#cd7f32', '#a78bfa', '#60a5fa'];
const defaultPrizes = [
  { rank: 1, amount: '15 POL' },
  { rank: 2, amount: '10 POL' },
  { rank: 3, amount: '5 POL' },
];

export default function ContestsPage() {
  const { uid } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const apiUrl = detectApiUrl();

  const [contests, setContests] = useState<Contest[]>([]);
  const [joined, setJoined] = useState<Record<string, boolean>>({});
  const [joining, setJoining] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [timers, setTimers] = useState<Record<string, string>>({});

  async function loadContests() {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/contests`);
      if (res.ok) {
        const d = await res.json();
        const list = d.contests || [];
        setContests(list);
        for (const c of list) {
          checkJoined(c.id);
        }
      }
    } catch {}
    setLoading(false);
  }

  function updateTimers() {
    const t: Record<string, string> = {};
    for (const c of contests) {
      t[c.id] = formatTimeLeft(c.endTime);
    }
    setTimers(t);
  }

  async function checkJoined(contestId: string) {
    try {
      const res = await fetch(`${apiUrl}/api/contests/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, contest_id: contestId, check_only: true }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.alreadyJoined) {
          setJoined(prev => ({ ...prev, [contestId]: true }));
        }
      }
    } catch {}
  }

  async function joinContest(contestId: string) {
    setJoining(contestId);
    try {
      const res = await fetch(`${apiUrl}/api/contests/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, contest_id: contestId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to join');
      setJoined(prev => ({ ...prev, [contestId]: true }));
      showToast('Joined contest successfully');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to join', 'error');
    }
    setJoining(null);
  }

  useEffect(() => {
    if (!uid) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadContests();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  if (loading) return <Loading text="Loading contests..." />;

  return (
    <div style={{ paddingBottom: 50 }}>
      {ToastComponent}

      <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', backdropFilter: 'blur(10px)', padding: 12, borderRadius: 14, marginBottom: 20, fontSize: 11, textAlign: 'center', color: '#fca5a5' }}>
        <strong>FAIRNESS NOTICE:</strong> Only new referrals joined AFTER your registration will be counted. Purging fake accounts will lead to permanent ban.
      </div>

      {contests.length === 0 ? (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 22, padding: '32px 20px', textAlign: 'center', marginBottom: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <h3 style={{ fontFamily: SG, fontSize: 16, fontWeight: 800, marginBottom: 8 }}>No Active Contest</h3>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>Check back soon for exciting competitions and prize pools.</p>
        </div>
      ) : (
        contests.map(contest => {
          const isJoined = joined[contest.id];
          const timeLeft = timers[contest.id] || '...';
          const isEnded = timeLeft === 'ENDED';
          const prizes = contest.prizes?.length ? contest.prizes : defaultPrizes;

          return (
            <div key={contest.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 22, padding: 20, marginBottom: 15 }}>
              <div style={{ fontFamily: SG, fontSize: 16, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span>{contest.name || 'Referral Contest'}</span>
                <span style={{ fontSize: 14, color: '#60a5fa', fontWeight: 800 }}>{timeLeft}</span>
              </div>
              {contest.description && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>{contest.description}</div>
              )}

              <div style={{ textAlign: 'center', padding: '10px 0', marginBottom: 12 }}>
                <span style={{ fontSize: 12, opacity: 0.5, textTransform: 'uppercase' as const, letterSpacing: 1, display: 'block' }}>Your Current Rank</span>
                <span style={{ fontSize: 32, fontWeight: 800, color: '#a78bfa', fontFamily: SG }}>--</span>
              </div>

              <button
                onClick={() => !isJoined && !isEnded && joinContest(contest.id)}
                disabled={isJoined || isEnded || joining === contest.id}
                style={{ width: '100%', padding: 18, border: 'none', borderRadius: 16, fontWeight: 800, fontSize: 15, cursor: isJoined || isEnded ? 'not-allowed' : 'pointer', fontFamily: INTER, background: isJoined ? 'rgba(255,255,255,0.05)' : isEnded ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: isJoined ? 'rgba(255,255,255,0.3)' : isEnded ? 'rgba(255,255,255,0.3)' : '#000' }}
              >
                {isJoined ? 'Joined Successfully' : isEnded ? 'Contest Ended' : joining === contest.id ? 'Joining...' : 'Join Contest'}
              </button>

              {isJoined && (
                <div style={{ marginTop: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600, marginBottom: 8 }}>Your Invite Link</div>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', padding: 10, borderRadius: 12 }}>
                    <input
                      type="text"
                      value={typeof window !== 'undefined' ? `${window.location.origin}/register?ref=` : ''}
                      readOnly
                      style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 12, width: '100%', outline: 'none', pointerEvents: 'none' as const }}
                    />
                    <div
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/register?ref=`);
                        showToast('Link Copied!');
                      }}
                      style={{ background: '#a78bfa', color: '#000', padding: '8px 15px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}
                    >
                      Copy
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, marginBottom: 12, color: '#a78bfa', fontWeight: 800, letterSpacing: 1 }}>PRIZE POOL</div>
                {prizes.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 10px', borderBottom: i < prizes.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
                        <path d="M26.4 10.4L17.2 4.8c-.8-.4-1.6-.4-2.4 0L5.6 10.4c-.8.4-.8 1.2 0 1.6l9.2 5.6c.8.4 1.6.4 2.4 0l9.2-5.6c.8-.4.8-1.2 0-1.6z" fill="#8247e5"/>
                        <path d="M14.8 13.6L5.6 19.2c-.8.4-.8 1.2 0 1.6l9.2 5.6c.8.4 1.6.4 2.4 0l9.2-5.6c.8-.4.8-1.2 0-1.6l-9.2-5.6c-.8-.4-1.6-.4-2.4 0z" fill="#8247e5" opacity="0.6"/>
                      </svg>
                      <span style={{ fontWeight: 800, color: prizeColors[i] || '#a78bfa' }}>Rank {p.rank}</span>
                    </div>
                    <b style={{ color: prizeColors[i] || '#a78bfa' }}>{p.amount}</b>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 22, padding: 20 }}>
        <div style={{ fontSize: 11, marginBottom: 12, color: '#a78bfa', fontWeight: 800, letterSpacing: 1 }}>HOW CONTESTS WORK</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { num: '1', text: 'Join the contest by submitting your POL (Polygon) wallet address' },
            { num: '2', text: 'Invite new users during the contest period' },
            { num: '3', text: 'Top referrers win POL prizes from the prize pool' },
          ].map(step => (
            <div key={step.num} style={{ display: 'flex', gap: 12, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(167,139,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 800, color: '#a78bfa' }}>{step.num}</div>
              <span>{step.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
