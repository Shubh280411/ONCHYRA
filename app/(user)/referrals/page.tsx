'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl, formatUSD } from '@/lib/utils';
import type { TeamMember, Commission } from '@/types';

interface UserData {
  referralCode: string;
  refLevel1: number;
  refLevel2: number;
  refLevel3: number;
  totalCommissions: number;
  teamBiz: number;
  totalDirects: number;
  activeDirects: number;
  legABiz: number;
  legBBiz: number;
  [key: string]: unknown;
}

interface LegStats {
  teamBiz: number;
  activeDirects: number;
  totalDirects: number;
  legABiz: number;
  legBBiz: number;
}

interface TeamResponse {
  levels: { 1: TeamMember[]; 2: TeamMember[]; 3: TeamMember[] };
  total: number;
}

export default function ReferralsPage() {
  const { uid } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const apiUrl = detectApiUrl();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [legStats, setLegStats] = useState<LegStats | null>(null);
  const [teamData, setTeamData] = useState<TeamResponse>({ levels: { 1: [], 2: [], 3: [] }, total: 0 });
  const [allCommissions, setAllCommissions] = useState<Commission[]>([]);
  const [activeTab, setActiveTab] = useState<'team' | 'comm'>('team');
  const [levelFilter, setLevelFilter] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [teamPage, setTeamPage] = useState(1);
  const [commPage, setCommPage] = useState(1);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [loadingComm, setLoadingComm] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [l1BizCache, setL1BizCache] = useState<Record<string, number>>({});

  const PAGE_SIZE = 10;

  // Derived stats
  const l1 = userData?.refLevel1 || 0;
  const l2 = userData?.refLevel2 || 0;
  const l3 = userData?.refLevel3 || 0;
  const totalNetwork = l1 + l2 + l3;
  const l1Onc = l1 * 0.25;
  const l2Onc = l2 * 0.10;
  const l3Onc = l3 * 0.05;
  const totalOnc = l1Onc + l2Onc + l3Onc;
  const totalBiz = legStats?.teamBiz ?? userData?.teamBiz ?? 0;
  const legABiz = legStats?.legABiz ?? userData?.legABiz ?? 0;
  const legBBiz = legStats?.legBBiz ?? userData?.legBBiz ?? 0;
  const activeDirects = legStats?.activeDirects ?? userData?.activeDirects ?? 0;
  const totalDirects = legStats?.totalDirects ?? userData?.totalDirects ?? 0;

  // Today's earnings
  const today = useMemo(() => {
    const todayStr = new Date().toDateString();
    let onc = 0, usdt = 0;
    for (const c of allCommissions) {
      if (c.createdAt && new Date(Number(c.createdAt)).toDateString() === todayStr) {
        if (c.type === 'registration_bonus') onc += c.amount;
        else usdt += c.amount;
      }
    }
    return { onc, usdt };
  }, [allCommissions]);

  // Filtered team
  const filteredTeam = useMemo(() => {
    const level = parseInt(levelFilter);
    const list = teamData.levels[level as keyof typeof teamData.levels] || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((u) => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
  }, [teamData, levelFilter, searchQuery]);

  const teamTotalPages = Math.ceil(filteredTeam.length / PAGE_SIZE) || 1;
  const pagedTeam = filteredTeam.slice((teamPage - 1) * PAGE_SIZE, teamPage * PAGE_SIZE);

  // Paginated commissions
  const commTotalPages = Math.ceil(allCommissions.length / PAGE_SIZE) || 1;
  const pagedCommissions = allCommissions.slice((commPage - 1) * PAGE_SIZE, commPage * PAGE_SIZE);

  // Load user data
  useEffect(() => {
    if (!uid) return;
    (async () => {
      setLoadingStats(true);
      try {
        const res = await fetch(`${apiUrl}/api/user/${uid}`);
        if (res.ok) setUserData(await res.json());
      } catch { /* silent */ }
      setLoadingStats(false);
    })();
  }, [uid, apiUrl]);

  // Load leg stats
  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/api/referrals/leg-stats/${uid}`);
        if (res.ok) setLegStats(await res.json());
      } catch { /* silent */ }
    })();
  }, [uid, apiUrl]);

  // Load team
  useEffect(() => {
    if (!uid) return;
    (async () => {
      setLoadingTeam(true);
      try {
        const maxLvl = parseInt(levelFilter);
        const offset = (teamPage - 1) * PAGE_SIZE;
        const params = maxLvl === 1
          ? `maxLevel=1&limit=${PAGE_SIZE}&offset=${offset}`
          : `maxLevel=${maxLvl}&limit=100&offset=0`;
        const res = await fetch(`${apiUrl}/api/referrals/team/${uid}?${params}`);
        if (res.ok) {
          const data = await res.json();
          setTeamData(data);
          // Build L1 biz cache
          const cache: Record<string, number> = {};
          for (const u of data.levels[1] || []) {
            let biz = Number(u.totalPackageSpend) || 0;
            for (const v of data.levels[2] || []) {
              if (v.referredBy === u.referralCode) {
                biz += Number(v.totalPackageSpend) || 0;
                for (const w of data.levels[3] || []) {
                  if (w.referredBy === v.referralCode) biz += Number(w.totalPackageSpend) || 0;
                }
              }
            }
            cache[u.referralCode] = biz;
          }
          setL1BizCache(cache);
        }
      } catch { /* silent */ }
      setLoadingTeam(false);
    })();
  }, [uid, apiUrl, levelFilter, teamPage]);

  // Load commissions
  useEffect(() => {
    if (!uid) return;
    (async () => {
      setLoadingComm(true);
      try {
        const res = await fetch(`${apiUrl}/api/referrals/commissions/${uid}`);
        if (res.ok) {
          const data = await res.json();
          const list = (data.commissions || []) as Commission[];
          list.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
          setAllCommissions(list);
        }
      } catch { /* silent */ }
      setLoadingComm(false);
    })();
  }, [uid, apiUrl]);

  function copyLink() {
    if (!userData?.referralCode) return;
    const link = `${window.location.origin}/register?ref=${userData.referralCode}`;
    navigator.clipboard.writeText(link);
    showToast('Invite link copied!');
  }

  function handleLevelChange(val: string) {
    setLevelFilter(val);
    setSearchQuery('');
    setTeamPage(1);
  }

  function fmtDate(ts: number | undefined) {
    if (!ts) return '-';
    const d = new Date(Number(ts));
    if (isNaN(d.getTime())) return '-';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
  }

  return (
    <div className="min-h-screen px-4 py-5 max-w-md mx-auto flex flex-col gap-3.5">
      {ToastComponent}

      {/* Header */}
      <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3.5">
        <Link
          href="/dashboard"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06] text-white shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
        </Link>
        <span className="font-[family-name:var(--font-space-grotesk)] font-black text-lg bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent flex-1">
          ONCHYRA
        </span>
        <div className="w-9" />
      </div>

      {/* Referral code hero */}
      <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/5 border border-purple-500/[0.12] rounded-3xl p-6 text-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-purple-500/[0.08] blur-2xl pointer-events-none" />
        <div className="text-[10px] font-bold uppercase tracking-[2px] text-white/25">Your Referral Code</div>
        <div className="font-[family-name:var(--font-space-grotesk)] font-black text-3xl tracking-[6px] mt-1.5 bg-gradient-to-r from-white to-purple-400/60 bg-clip-text text-transparent">
          {userData?.referralCode || '---'}
        </div>
        <button onClick={copyLink} className="w-full mt-3 py-3.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-black font-[family-name:var(--font-space-grotesk)] font-black text-sm">
          COPY INVITE LINK
        </button>
      </div>

      {loadingStats ? (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-2 border-white/10 border-t-[var(--primary)] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-3 p-2 bg-transparent">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/[0.12] shrink-0">
                  <svg width="18" height="18" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </div>
                <div>
                  <div className="font-[family-name:var(--font-space-grotesk)] font-black text-base">{totalNetwork}</div>
                  <div className="text-[9px] text-white/25 uppercase tracking-wider">Network</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-transparent">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/[0.12] shrink-0">
                  <svg width="18" height="18" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                </div>
                <div>
                  <div className="font-[family-name:var(--font-space-grotesk)] font-black text-base">{formatUSD(totalBiz)}</div>
                  <div className="text-[9px] text-white/25 uppercase tracking-wider">Business</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-transparent">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-yellow-500/[0.12] shrink-0">
                  <svg width="18" height="18" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                </div>
                <div>
                  <div className="font-[family-name:var(--font-space-grotesk)] font-black text-base">{totalOnc.toFixed(2)} ONC</div>
                  <div className="text-[9px] text-white/25 uppercase tracking-wider">ONC Bonus</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-transparent">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-500/[0.12] shrink-0">
                  <svg width="18" height="18" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                </div>
                <div>
                  <div className="font-[family-name:var(--font-space-grotesk)] font-black text-base">{formatUSD(userData?.totalCommissions || 0)}</div>
                  <div className="text-[9px] text-white/25 uppercase tracking-wider">Commission</div>
                </div>
              </div>
            </div>
          </div>

          {/* Directs + legs */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-3 p-2 bg-transparent">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/[0.12] shrink-0">
                  <svg width="18" height="18" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                </div>
                <div>
                  <div className="font-[family-name:var(--font-space-grotesk)] font-black text-base">{activeDirects}/{totalDirects}</div>
                  <div className="text-[9px] text-white/25 uppercase tracking-wider">Active / Total Direct</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-transparent">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-500/[0.12] shrink-0">
                  <svg width="18" height="18" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                </div>
                <div>
                  <div className="font-[family-name:var(--font-space-grotesk)] font-black text-base">{formatUSD(legABiz)}</div>
                  <div className="text-[9px] text-white/25 uppercase tracking-wider">Leg A</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-transparent">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-yellow-500/[0.12] shrink-0">
                  <svg width="18" height="18" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                </div>
                <div>
                  <div className="font-[family-name:var(--font-space-grotesk)] font-black text-base">{formatUSD(legBBiz)}</div>
                  <div className="text-[9px] text-white/25 uppercase tracking-wider">Leg B</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-transparent">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-500/[0.12] shrink-0">
                  <svg width="18" height="18" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                </div>
                <div>
                  <div className="font-[family-name:var(--font-space-grotesk)] font-black text-sm flex gap-1.5 items-center flex-wrap">
                    <span>{today.onc.toFixed(2)} ONC</span>
                    <span className="text-[9px] opacity-20">|</span>
                    <span>{formatUSD(today.usdt)}</span>
                  </div>
                  <div className="text-[9px] text-white/25 uppercase tracking-wider">Today&apos;s Earnings</div>
                </div>
              </div>
            </div>
          </div>

          {/* Level breakdown */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
            <div className="text-[10px] font-extrabold text-white/30 uppercase tracking-wider mb-2">Level Breakdown</div>
            <div className="flex justify-between items-center py-2.5 border-b border-white/[0.03] last:border-b-0">
              <span><span className="text-[var(--primary)] font-extrabold">Vanguard</span> <span className="text-white/30">(L1)</span></span>
              <span className="text-sm">{l1} users &middot; {l1Onc.toFixed(2)} ONC</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-white/[0.03] last:border-b-0">
              <span><span className="text-[var(--secondary)] font-extrabold">Guardians</span> <span className="text-white/30">(L2)</span></span>
              <span className="text-sm">{l2} users &middot; {l2Onc.toFixed(2)} ONC</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-white/[0.03] last:border-b-0">
              <span><span className="text-yellow-400 font-extrabold">Seekers</span> <span className="text-white/30">(L3)</span></span>
              <span className="text-sm">{l3} users &middot; {l3Onc.toFixed(2)} ONC</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-white/[0.06] mt-1">
              <span className="font-extrabold">Total</span>
              <span className="text-sm">{totalNetwork} users &middot; {totalOnc.toFixed(2)} ONC</span>
            </div>
          </div>
        </>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setActiveTab('team')}
          className={`flex-1 py-2.5 rounded-xl border text-[11px] font-bold transition-all ${
            activeTab === 'team'
              ? 'border-[var(--primary)] text-white bg-purple-500/[0.06]'
              : 'border-white/[0.06] text-white/30 bg-white/[0.03]'
          }`}
        >
          Network
        </button>
        <button
          onClick={() => setActiveTab('comm')}
          className={`flex-1 py-2.5 rounded-xl border text-[11px] font-bold transition-all ${
            activeTab === 'comm'
              ? 'border-[var(--primary)] text-white bg-purple-500/[0.06]'
              : 'border-white/[0.06] text-white/30 bg-white/[0.03]'
          }`}
        >
          Commissions
        </button>
      </div>

      {/* Team view */}
      {activeTab === 'team' && (
        <div>
          <select
            value={levelFilter}
            onChange={(e) => handleLevelChange(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl border border-white/[0.06] bg-white/[0.03] text-white text-xs font-bold outline-none mb-2"
          >
            <option value="1">Vanguard (L1) &mdash; {l1Onc.toFixed(2)} ONC</option>
            <option value="2">Guardians (L2) &mdash; {l2Onc.toFixed(2)} ONC</option>
            <option value="3">Seekers (L3) &mdash; {l3Onc.toFixed(2)} ONC</option>
          </select>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setTeamPage(1); }}
            placeholder="Search member by name..."
            className="w-full px-3.5 py-3 rounded-xl border border-white/[0.06] bg-white/[0.03] text-white text-xs font-semibold outline-none mb-2"
          />

          {loadingTeam ? (
            <div className="py-5 text-center text-xs text-white/30">Loading team...</div>
          ) : pagedTeam.length === 0 ? (
            <div className="py-10 text-center text-xs text-white/20">{searchQuery ? 'No members match your search' : 'No members in this level'}</div>
          ) : (
            <>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
                {pagedTeam.map((u) => {
                  const biz = l1BizCache[u.referralCode] ?? (Number(u.totalPackageSpend) || 0);
                  const teamCount = (Number(u.refLevel1) || 0) + (Number(u.refLevel2) || 0) + (Number(u.refLevel3) || 0);
                  return (
                    <div key={u.uid} className="flex justify-between items-center px-4 py-3.5 border-b border-white/[0.03] last:border-b-0 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div>
                          <div className="font-bold text-[13px]">{u.name || 'User'}</div>
                          {u.email && <div className="text-[9px] text-white/35 mt-0.5">{u.email}</div>}
                          <div className="flex gap-2 mt-0.5 flex-wrap text-[9px] text-white/25">
                            <span>{fmtDate(u.createdAt as unknown as number)}</span>
                            <span>Team: {teamCount}</span>
                            <span>Biz: {formatUSD(biz)}</span>
                            {u.activePackage ? (
                              <span className="text-[7px] font-extrabold px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/15 uppercase">Package</span>
                            ) : (
                              <span className="text-[7px] font-extrabold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/15 uppercase">No Pkg</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-[9px] px-2.5 py-1 rounded-md bg-purple-500/10 text-[var(--primary)] font-extrabold">L{levelFilter}</span>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {teamTotalPages > 1 && (
                <div className="flex gap-1 justify-center mt-2 flex-wrap">
                  {teamPage > 1 && (
                    <button onClick={() => setTeamPage(teamPage - 1)} className="px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white font-bold text-[11px]">&lsaquo; Prev</button>
                  )}
                  {Array.from({ length: teamTotalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setTeamPage(p)}
                      className={`px-3 py-2 rounded-lg border font-bold text-[11px] ${
                        p === teamPage
                          ? 'bg-[var(--primary)] text-black border-[var(--primary)]'
                          : 'bg-white/[0.03] border-white/[0.06] text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  {teamPage < teamTotalPages && (
                    <button onClick={() => setTeamPage(teamPage + 1)} className="px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white font-bold text-[11px]">Next &rsaquo;</button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Commissions view */}
      {activeTab === 'comm' && (
        <div>
          {loadingComm ? (
            <div className="py-5 text-center text-xs text-white/30">Loading commissions...</div>
          ) : allCommissions.length === 0 ? (
            <div className="py-10 text-center text-xs text-white/20">No commissions yet</div>
          ) : (
            <>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
                {pagedCommissions.map((c) => {
                  const typeLabel = c.type === 'registration_bonus' ? 'Registration' : c.type === 'matching_bonus' ? 'Matching' : 'Package';
                  const typeColor = c.type === 'registration_bonus' ? 'text-yellow-400' : c.type === 'matching_bonus' ? 'text-[var(--secondary)]' : 'text-green-400';
                  const cur = c.type === 'registration_bonus' ? ' ONC' : '$';
                  return (
                    <div key={c.id} className="flex justify-between items-center px-4 py-3.5 border-b border-white/[0.03] last:border-b-0 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div>
                          <div className="font-bold text-[13px]">{c.fromName || 'User'}</div>
                          <div className="flex gap-2 mt-0.5 flex-wrap text-[9px] text-white/25">
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-white/[0.04] ${typeColor}`}>{typeLabel}</span>
                            <span>Level {c.level}</span>
                            <span>{fmtDate(c.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <span className="font-extrabold text-green-400">+{cur}{(Number(c.amount) || 0).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {commTotalPages > 1 && (
                <div className="flex gap-1 justify-center mt-2 flex-wrap">
                  {commPage > 1 && (
                    <button onClick={() => setCommPage(commPage - 1)} className="px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white font-bold text-[11px]">&lsaquo; Prev</button>
                  )}
                  {Array.from({ length: commTotalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setCommPage(p)}
                      className={`px-3 py-2 rounded-lg border font-bold text-[11px] ${
                        p === commPage
                          ? 'bg-[var(--primary)] text-black border-[var(--primary)]'
                          : 'bg-white/[0.03] border-white/[0.06] text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  {commPage < commTotalPages && (
                    <button onClick={() => setCommPage(commPage + 1)} className="px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white font-bold text-[11px]">Next &rsaquo;</button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
