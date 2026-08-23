'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl, formatUSD } from '@/lib/utils';
import Loading from '@/components/ui/Loading';

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
  gold: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="5" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" /><path d="M8 21l4-3 4 3V12H8v9z" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" /></svg>,
  silver: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="5" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" /><path d="M8 21l4-3 4 3V12H8v9z" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" /></svg>,
  bronze: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="5" fill="#d97706" stroke="#78350f" strokeWidth="1.5" /><path d="M8 21l4-3 4 3V12H8v9z" fill="#d97706" stroke="#78350f" strokeWidth="1.5" /></svg>,
};

export default function LeaderboardPage() {
  const { uid } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const apiUrl = detectApiUrl();

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
    const el = document.getElementById('my-rank-item');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (loading) return <Loading text="Loading leaderboard..." />;

  return (
    <div className="min-h-screen px-4 py-5 max-w-md mx-auto flex flex-col gap-3.5">
      {ToastComponent}

      {/* Header */}
      <div className="flex justify-between items-center py-1.5">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-[var(--primary)] text-sm font-bold no-underline">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
          DASHBOARD
        </Link>
        <span className="font-[family-name:var(--font-space-grotesk)] font-extrabold text-xl tracking-wider">ONCHYRA</span>
      </div>

      {/* My Rank Card */}
      <div className="bg-gradient-to-br from-indigo-950 to-slate-900 border border-purple-500/30 rounded-3xl p-6 text-center relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="absolute -inset-1/2 bg-[radial-gradient(circle,rgba(167,139,250,0.1)_0%,transparent_60%)] pointer-events-none" />
        <div className="relative text-[11px] uppercase tracking-[2px] opacity-60 mb-2">Global Standing</div>
        <div className="relative font-[family-name:var(--font-space-grotesk)] font-extrabold text-5xl mb-2.5">
          {myRank ? `#${myRank.toLocaleString()}` : '--'}
        </div>
        <div className="relative text-sm font-bold text-green-400 bg-green-500/10 px-4 py-1.5 rounded-full inline-block">
          {formatUSD(myBalance)} ONC
        </div>
      </div>

      {/* List Container */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-5">
        {/* List Header */}
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-white/[0.06]">
          <div>
            <h3 className="font-[family-name:var(--font-space-grotesk)] font-extrabold text-lg">Top Validators</h3>
            <div className="text-xs opacity-50 mt-0.5">{totalUsers.toLocaleString()} Validators</div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-xs font-semibold outline-none transition-all focus:border-[var(--primary)] placeholder:text-white/20"
          />
        </div>

        {/* Leaderboard List */}
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-xs text-white/20">
            {search ? 'No validators match your search' : 'No validators found'}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map(u => {
              const isMe = uid && u.uid === uid;
              const team = (u.refLevel1 || 0) + (u.refLevel2 || 0) + (u.refLevel3 || 0);

              return (
                <div
                  key={u.uid}
                  id={isMe ? 'my-rank-item' : undefined}
                  className={`flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border transition-all ${
                    isMe ? 'border-[var(--primary)] bg-purple-500/[0.08]' : 'border-transparent hover:bg-white/[0.04]'
                  }`}
                >
                  {u._rank <= 3 ? (
                    <div className="w-10 h-10 flex items-center justify-center shrink-0">
                      {u._rank === 1 ? MEDAL_SVG.gold : u._rank === 2 ? MEDAL_SVG.silver : MEDAL_SVG.bronze}
                    </div>
                  ) : (
                    <div className="w-10 font-extrabold font-[family-name:var(--font-space-grotesk)] text-base text-white/30 text-center shrink-0">
                      {u._rank < 10 ? `0${u._rank}` : u._rank}
                    </div>
                  )}
                  <div className="flex-1 ml-2.5 min-w-0">
                    <div className="font-bold text-sm truncate">{u.name || 'Anonymous Miner'}</div>
                    <div className="text-[10px] font-semibold text-[var(--primary)] uppercase flex items-center gap-1 mt-0.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                      Team: {team}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-[family-name:var(--font-space-grotesk)] font-extrabold text-base text-white">{(u.balance || 0).toFixed(2)}</div>
                    <div className="text-[9px] opacity-40 font-bold">ONC</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Scroll to me */}
        {myRank && (
          <div className="text-center mt-3">
            <button
              onClick={scrollToMe}
              className="px-5 py-2 border border-white/[0.06] rounded-full bg-purple-500/[0.1] text-[var(--primary)] text-[11px] font-bold transition-all hover:bg-purple-500/20"
            >
              Scroll to my rank
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
