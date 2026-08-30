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

const PAGE_SIZE = 10;

function fmtDate(ts: number | undefined) {
  if (!ts) return '-';
  const d = new Date(Number(ts));
  if (isNaN(d.getTime())) return '-';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
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

  const l1 = userData?.refLevel1 || 0;
  const l2 = userData?.refLevel2 || 0;
  const l3 = userData?.refLevel3 || 0;
  const totalNetwork = l1 + l2 + l3;
  const l1Onc = l1 * 0.10;
  const l2Onc = l2 * 0.05;
  const l3Onc = l3 * 0.03;
  const totalOnc = l1Onc + l2Onc + l3Onc;
  const totalBiz = legStats?.teamBiz ?? userData?.teamBiz ?? 0;
  const legABiz = legStats?.legABiz ?? userData?.legABiz ?? 0;
  const legBBiz = legStats?.legBBiz ?? userData?.legBBiz ?? 0;
  const activeDirects = legStats?.activeDirects ?? userData?.activeDirects ?? 0;
  const totalDirects = legStats?.totalDirects ?? userData?.totalDirects ?? 0;

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

  const filteredTeam = useMemo(() => {
    const level = parseInt(levelFilter);
    const list = teamData.levels[level as keyof typeof teamData.levels] || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((u) => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
  }, [teamData, levelFilter, searchQuery]);

  const teamTotalPages = Math.ceil(filteredTeam.length / PAGE_SIZE) || 1;
  const pagedTeam = filteredTeam.slice((teamPage - 1) * PAGE_SIZE, teamPage * PAGE_SIZE);

  const commTotalPages = Math.ceil(allCommissions.length / PAGE_SIZE) || 1;
  const pagedCommissions = allCommissions.slice((commPage - 1) * PAGE_SIZE, commPage * PAGE_SIZE);

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

  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/api/referrals/leg-stats/${uid}`);
        if (res.ok) setLegStats(await res.json());
      } catch { /* silent */ }
    })();
  }, [uid, apiUrl]);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      setLoadingTeam(true);
      try {
        const maxLvl = parseInt(levelFilter);
        const params = maxLvl === 1
          ? `maxLevel=1&limit=1000&offset=0`
          : `maxLevel=${maxLvl}&limit=100&offset=0`;
        const res = await fetch(`${apiUrl}/api/referrals/team/${uid}?${params}`);
        if (res.ok) {
          const data = await res.json();
          setTeamData(data);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <style>{`
        .ref-hero-stats{display:grid;grid-template-columns:1fr;gap:14px}
        .ref-stats4{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        @media(min-width:768px){
          .ref-hero-stats{grid-template-columns:340px 1fr}
          .ref-stats4{grid-template-columns:repeat(4,1fr)}
        }
      `}</style>
      <div style={{ width: '100%', maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {ToastComponent}

        {/* Hero + Stats 1 side by side on desktop */}
        <div className="ref-hero-stats">
          {/* Referral hero */}
          <div style={{ background: 'linear-gradient(135deg,rgba(167,139,250,0.1),rgba(96,165,250,0.05))', border: '1px solid rgba(167,139,250,0.12)', borderRadius: 24, padding: '24px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(167,139,250,0.08)', filter: 'blur(40px)', pointerEvents: 'none' }} />
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(255,255,255,0.25)' }}>Your Referral Code</div>
            <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 900, fontSize: 32, letterSpacing: 6, marginTop: 6, marginBottom: 6, background: 'linear-gradient(135deg,#fff 20%,rgba(167,139,250,0.6))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {userData?.referralCode || '---'}
            </div>
            <button onClick={copyLink} style={{ width: '100%', padding: 14, border: 'none', borderRadius: 14, background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', color: '#000', fontWeight: 900, fontSize: 13, cursor: 'pointer', fontFamily: "'Inter'", marginTop: 12 }}>
              COPY INVITE LINK
            </button>
          </div>

          {/* Stats 1 */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 16 }}>
            <div className="ref-stats4">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: 'none', background: 'transparent', padding: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(167,139,250,0.12)' }}>
                  <svg width="20" height="20" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </div>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 900, fontSize: 17 }}>{totalNetwork}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Network</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: 'none', background: 'transparent', padding: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(96,165,250,0.12)' }}>
                  <svg width="20" height="20" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                </div>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 900, fontSize: 17 }}>{formatUSD(totalBiz)}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Business</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: 'none', background: 'transparent', padding: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(245,158,11,0.12)' }}>
                  <svg width="20" height="20" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                </div>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 900, fontSize: 17 }}>{totalOnc.toFixed(2)} ONC</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 0.5 }}>ONC Bonus</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: 'none', background: 'transparent', padding: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(34,197,94,0.12)' }}>
                  <svg width="20" height="20" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                </div>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 900, fontSize: 17 }}>{formatUSD(userData?.totalCommissions || 0)}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Commission</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid 2 */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 16 }}>
          <div className="ref-stats4">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: 'none', background: 'transparent', padding: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(167,139,250,0.12)' }}>
                <svg width="20" height="20" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 900, fontSize: 17 }}>{activeDirects}/{totalDirects}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Active / Total Direct</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: 'none', background: 'transparent', padding: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(34,197,94,0.12)' }}>
                <svg width="20" height="20" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 900, fontSize: 17 }}>{formatUSD(legABiz)}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Leg A</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: 'none', background: 'transparent', padding: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(245,158,11,0.12)' }}>
                    <svg width="20" height="20" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 900, fontSize: 17 }}>{formatUSD(legBBiz)}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Leg B</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: 'none', background: 'transparent', padding: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(34,197,94,0.12)' }}>
                <svg width="20" height="20" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', fontFamily: "'Space Grotesk'", fontWeight: 900, fontSize: 17 }}>
                  <span>{today.onc.toFixed(2)} ONC</span>
                  <span style={{ fontSize: 9, opacity: 0.2 }}>|</span>
                  <span>{formatUSD(today.usdt)}</span>
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Today&apos;s Earnings</div>
              </div>
            </div>
          </div>
        </div>

        {/* Level breakdown */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Level Breakdown</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 12 }}>
            <span><span style={{ color: '#a78bfa', fontWeight: 800 }}>Vanguard</span> <span style={{ color: 'rgba(255,255,255,0.3)' }}>(L1)</span></span>
            <span>{l1} users - {l1Onc.toFixed(2)} ONC</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 12 }}>
            <span><span style={{ color: '#60a5fa', fontWeight: 800 }}>Guardians</span> <span style={{ color: 'rgba(255,255,255,0.3)' }}>(L2)</span></span>
            <span>{l2} users - {l2Onc.toFixed(2)} ONC</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: 'none', fontSize: 12 }}>
            <span><span style={{ color: '#f59e0b', fontWeight: 800 }}>Seekers</span> <span style={{ color: 'rgba(255,255,255,0.3)' }}>(L3)</span></span>
            <span>{l3} users - {l3Onc.toFixed(2)} ONC</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0 0', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 4 }}>
            <span style={{ fontWeight: 800 }}>Total</span>
            <span>{totalNetwork} users - {totalOnc.toFixed(2)} ONC</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setActiveTab('team')}
            style={{
              flex: 1, padding: 10, border: `1px solid ${activeTab === 'team' ? '#a78bfa' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 12, background: activeTab === 'team' ? 'rgba(167,139,250,0.06)' : 'rgba(255,255,255,0.04)',
              textAlign: 'center', fontSize: 11, fontWeight: 700,
              color: activeTab === 'team' ? '#fff' : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            Network
          </button>
          <button
            onClick={() => setActiveTab('comm')}
            style={{
              flex: 1, padding: 10, border: `1px solid ${activeTab === 'comm' ? '#a78bfa' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 12, background: activeTab === 'comm' ? 'rgba(167,139,250,0.06)' : 'rgba(255,255,255,0.04)',
              textAlign: 'center', fontSize: 11, fontWeight: 700,
              color: activeTab === 'comm' ? '#fff' : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            Commissions
          </button>
        </div>

        {/* Team view */}
        {activeTab === 'team' && (
          <div>
            <select
              value={levelFilter}
              onChange={(e) => handleLevelChange(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: 12, fontWeight: 700, outline: 'none', marginBottom: 8 }}
            >
              <option value="1">Vanguard (L1) - {l1Onc.toFixed(2)} ONC</option>
              <option value="2">Guardians (L2) - {l2Onc.toFixed(2)} ONC</option>
              <option value="3">Seekers (L3) - {l3Onc.toFixed(2)} ONC</option>
            </select>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setTeamPage(1); }}
                placeholder="Search member by name..."
                style={{ width: '100%', padding: '12px 14px 12px 36px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: 12, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {loadingTeam ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Loading team...</div>
            ) : pagedTeam.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
                <svg width="32" height="32" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" viewBox="0 0 24 24" style={{ margin: '0 auto 12px' }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                {searchQuery ? 'No members match your search' : 'No members in this level'}
              </div>
            ) : (
              <>
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, overflow: 'hidden' }}>
                  {pagedTeam.map((u) => {
                    const biz = l1BizCache[u.referralCode] ?? (Number(u.totalPackageSpend) || 0);
                    const teamCount = (Number(u.refLevel1) || 0) + (Number(u.refLevel2) || 0) + (Number(u.refLevel3) || 0);
                    return (
                      <div key={u.uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(167,139,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="16" height="16" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name || 'User'}</div>
                            {u.email && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>}
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <svg width="8" height="8" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                {fmtDate(u.createdAt as unknown as number)}
                              </span>
                              <span>Team: {teamCount}</span>
                              <span>Biz: {formatUSD(biz)}</span>
                              {u.activePackage ? (
                                <span style={{ fontSize: 7, fontWeight: 800, padding: '2px 7px', borderRadius: 5, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.15)', textTransform: 'uppercase' }}>Package</span>
                              ) : (
                                <span style={{ fontSize: 7, fontWeight: 800, padding: '2px 7px', borderRadius: 5, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)', textTransform: 'uppercase' }}>No Pkg</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: 9, padding: '4px 10px', borderRadius: 6, background: 'rgba(167,139,250,0.1)', color: '#a78bfa', fontWeight: 800, flexShrink: 0 }}>L{levelFilter}</span>
                      </div>
                    );
                  })}
                </div>

                {teamTotalPages > 1 && (
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                    {teamPage > 1 && (
                      <button onClick={() => setTeamPage(teamPage - 1)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'white', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24" style={{ verticalAlign: 'middle' }}><path d="M15 18l-6-6 6-6" /></svg>
                      </button>
                    )}
                    {Array.from({ length: teamTotalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setTeamPage(p)}
                        style={{
                          padding: '8px 12px', borderRadius: 8, border: '1px solid',
                          borderColor: p === teamPage ? '#a78bfa' : 'rgba(255,255,255,0.1)',
                          background: p === teamPage ? '#a78bfa' : 'rgba(255,255,255,0.04)',
                          color: p === teamPage ? '#000' : 'white', fontWeight: 700, fontSize: 11, cursor: 'pointer'
                        }}
                      >
                        {p}
                      </button>
                    ))}
                    {teamPage < teamTotalPages && (
                      <button onClick={() => setTeamPage(teamPage + 1)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'white', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24" style={{ verticalAlign: 'middle' }}><path d="M9 18l6-6-6-6" /></svg>
                      </button>
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
              <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Loading commissions...</div>
            ) : allCommissions.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
                <svg width="32" height="32" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" viewBox="0 0 24 24" style={{ margin: '0 auto 12px' }}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                No commissions yet
              </div>
            ) : (
              <>
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, overflow: 'hidden' }}>
                  {pagedCommissions.map((c) => {
                    const typeLabel = c.type === 'registration_bonus' ? 'Registration' : c.type === 'matching_bonus' ? 'Matching' : 'Package';
                    const typeColor = c.type === 'registration_bonus' ? '#f59e0b' : c.type === 'matching_bonus' ? '#60a5fa' : '#22c55e';
                    const cur = c.type === 'registration_bonus' ? ' ONC' : '$';
                    return (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: `rgba(${typeColor === '#22c55e' ? '34,197,94' : typeColor === '#f59e0b' ? '245,158,11' : '96,165,250'},0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {c.type === 'registration_bonus' ? (
                              <svg width="16" height="16" fill="none" stroke={typeColor} strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                            ) : c.type === 'matching_bonus' ? (
                              <svg width="16" height="16" fill="none" stroke={typeColor} strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                            ) : (
                              <svg width="16" height="16" fill="none" stroke={typeColor} strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{c.fromName || 'User'}</div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                              <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', color: typeColor }}>{typeLabel}</span>
                              <span>Level {c.level}</span>
                              <span>{fmtDate(c.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <span style={{ fontWeight: 800, color: '#22c55e', flexShrink: 0 }}>+{cur}{(Number(c.amount) || 0).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>

                {commTotalPages > 1 && (
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                    {commPage > 1 && (
                      <button onClick={() => setCommPage(commPage - 1)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'white', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24" style={{ verticalAlign: 'middle' }}><path d="M15 18l-6-6 6-6" /></svg>
                      </button>
                    )}
                    {Array.from({ length: commTotalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setCommPage(p)}
                        style={{
                          padding: '8px 12px', borderRadius: 8, border: '1px solid',
                          borderColor: p === commPage ? '#a78bfa' : 'rgba(255,255,255,0.1)',
                          background: p === commPage ? '#a78bfa' : 'rgba(255,255,255,0.04)',
                          color: p === commPage ? '#000' : 'white', fontWeight: 700, fontSize: 11, cursor: 'pointer'
                        }}
                      >
                        {p}
                      </button>
                    ))}
                    {commPage < commTotalPages && (
                      <button onClick={() => setCommPage(commPage + 1)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'white', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24" style={{ verticalAlign: 'middle' }}><path d="M9 18l6-6-6-6" /></svg>
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
