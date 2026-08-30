'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl, formatUSD } from '@/lib/utils';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

interface OncEntry {
  uid: string;
  name: string;
  balance: number;
  refLevel1: number;
  refLevel2: number;
  refLevel3: number;
  _rank: number;
}

interface OnxEntry {
  uid: string;
  name: string;
  onxBalance: number;
  onxClaimed: number;
  _rank: number;
}

const MEDAL_SVG = {
  gold: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="5" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
      <path d="M8 21l4-3 4 3V12H8v9z" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
    </svg>
  ),
  silver: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="5" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
      <path d="M8 21l4-3 4 3V12H8v9z" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
    </svg>
  ),
  bronze: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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

  const [tab, setTab] = useState<'onc' | 'onx'>('onc');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [oncLeaders, setOncLeaders] = useState<OncEntry[]>([]);
  const [oncMyRank, setOncMyRank] = useState<number | null>(null);
  const [oncMyBalance, setOncMyBalance] = useState(0);
  const [oncTotal, setOncTotal] = useState(0);

  const [onxLeaders, setOnxLeaders] = useState<OnxEntry[]>([]);
  const [onxMyRank, setOnxMyRank] = useState<number | null>(null);
  const [onxMyBalance, setOnxMyBalance] = useState(0);
  const [onxTotal, setOnxTotal] = useState(0);

  useEffect(() => { loadAll(); }, [uid]);

  async function loadAll() {
    setLoading(true);
    try {
      const myUid = uid || '';
      const [oncRes, onxRes] = await Promise.all([
        fetch(`${apiUrl}/api/leaderboard?limit=100&myUid=${myUid}`),
        fetch(`${apiUrl}/api/leaderboard/onx?limit=100&myUid=${myUid}`),
      ]);

      if (oncRes.ok) {
        const d = await oncRes.json();
        setOncLeaders((d.leaders || []).map((e: Record<string, unknown>, i: number) => ({ ...e, _rank: e.rank || (i + 1) })));
        setOncMyRank(d.myRank || null);
        setOncMyBalance(d.myUserData ? Number(d.myUserData.balance) || 0 : 0);
        setOncTotal(d.totalUsers || 0);
      }

      if (onxRes.ok) {
        const d = await onxRes.json();
        setOnxLeaders((d.leaders || []).map((e: Record<string, unknown>, i: number) => ({ ...e, _rank: e.rank || (i + 1) })));
        setOnxMyRank(d.myRank || null);
        setOnxMyBalance(d.myUserData ? Number(d.myUserData.onxBalance) || 0 : 0);
        setOnxTotal(d.totalUsers || 0);
      }
    } catch { /* silent */ }
    setLoading(false);
  }

  const filteredOnc = useMemo(() => {
    if (!search.trim()) return oncLeaders;
    const q = search.toLowerCase();
    return oncLeaders.filter(u => (u.name || '').toLowerCase().includes(q));
  }, [oncLeaders, search]);

  const filteredOnx = useMemo(() => {
    if (!search.trim()) return onxLeaders;
    const q = search.toLowerCase();
    return onxLeaders.filter(u => (u.name || '').toLowerCase().includes(q));
  }, [onxLeaders, search]);

  const currentLeaders = tab === 'onc' ? filteredOnc : filteredOnx;
  const currentMyRank = tab === 'onc' ? oncMyRank : onxMyRank;
  const currentMyBalance = tab === 'onc' ? oncMyBalance : onxMyBalance;
  const currentTotal = tab === 'onc' ? oncTotal : onxTotal;

  function scrollToMe() {
    myRankRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (loading) {
    return (
      <div className="lb-wrap">
        <div className="lb-bg" />
        <div className="lb-inner" style={{ paddingTop: 40, textAlign: 'center' }}>
          <div className="lb-spinner" />
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Loading leaderboard...</div>
        </div>
        <style>{`
          .lb-wrap{padding:12px;overflow-x:hidden}
          .lb-bg{position:fixed;top:-10%;left:-10%;width:120%;height:120%;background:radial-gradient(circle at 20% 30%,#6d28d933,transparent 40%),radial-gradient(circle at 80% 70%,#2563eb33,transparent 40%);z-index:-1}
          .lb-inner{max-width:600px;margin:0 auto}
          .lb-spinner{width:28px;height:28px;border:3px solid rgba(255,255,255,0.05);border-top-color:#a78bfa;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 10px}
          @keyframes spin{to{transform:rotate(360deg)}}
        `}</style>
      </div>
    );
  }

  return (
    <div className="lb-wrap">
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .lb-wrap{padding:12px;overflow-x:hidden}
        .lb-bg{position:fixed;top:-10%;left:-10%;width:120%;height:120%;background:radial-gradient(circle at 20% 30%,#6d28d933,transparent 40%),radial-gradient(circle at 80% 70%,#2563eb33,transparent 40%);z-index:-1}
        .lb-inner{max-width:600px;margin:0 auto}
        .lb-tabs{display:flex;gap:6px;margin-bottom:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:3px}
        .lb-tab{flex:1;padding:8px 0;border-radius:9px;border:none;font-family:${SG};font-weight:800;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:0.2s}
        .lb-tab.active{background:rgba(167,139,250,0.12)}
        .lb-rank-card{background:linear-gradient(135deg,#1e1b4b,#0f172a);border:1px solid rgba(167,139,250,0.3);border-radius:20px;padding:20px 16px;text-align:center;margin-bottom:16px;box-shadow:0 10px 30px rgba(0,0,0,0.5);position:relative;overflow:hidden}
        .lb-rank-card .bg{position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(167,139,250,0.1) 0%,transparent 60%)}
        .lb-rank-label{font-size:10px;text-transform:uppercase;letter-spacing:2px;opacity:0.6;margin-bottom:6px;position:relative;z-index:1}
        .lb-rank-num{font-family:${SG};font-size:36px;font-weight:800;color:white;line-height:1;margin-bottom:8px;position:relative;z-index:1}
        .lb-rank-badge{font-size:12px;font-weight:700;padding:4px 12px;border-radius:16px;display:inline-flex;align-items:center;gap:5px;position:relative;z-index:1}
        .lb-list-box{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:14px 8px}
        .lb-list-head{display:flex;justify-content:space-between;align-items:center;padding:0 10px 10px;border-bottom:1px solid rgba(255,255,255,0.08);margin-bottom:10px}
        .lb-list-head h3{font-family:${SG};font-size:15px;font-weight:700;margin:0;display:flex;align-items:center;gap:6px}
        .lb-list-head span{font-size:11px;opacity:0.5;display:flex;align-items:center;gap:4px}
        .lb-search{padding:0 10px 10px}
        .lb-search input{width:100%;padding:8px 12px 8px 32px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:white;font-size:12px;font-family:${INTER};outline:none;box-sizing:border-box}
        .lb-search input:focus{border-color:#a78bfa}
        .lb-item{display:flex;align-items:center;gap:8px;padding:10px 10px;margin-bottom:6px;border-radius:14px;transition:background 0.15s}
        .lb-item.me{background:rgba(167,139,250,0.08);border:1px solid #a78bfa}
        .lb-item:not(.me){border:1px solid transparent}
        .lb-item-rank{width:28px;display:flex;align-items:center;justify-content:center;flexShrink:0;font-weight:800;font-family:${SG};font-size:13px;color:rgba(255,255,255,0.3)}
        .lb-item-info{flex:1;min-width:0}
        .lb-item-name{font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:1px}
        .lb-item-sub{font-size:9px;font-weight:600;display:flex;align-items:center;gap:3px}
        .lb-item-bal{text-align:right;flex-shrink:0}
        .lb-item-bal-num{font-family:${SG};font-weight:800;font-size:14px;color:#fff}
        .lb-item-bal-label{font-size:8px;opacity:0.4;font-weight:700}
        .lb-scroll-btn{text-align:center;padding:8px 0 2px}
        .lb-scroll-btn button{padding:6px 16px;border:1px solid rgba(255,255,255,0.08);border-radius:100px;background:rgba(167,139,250,0.1);color:#a78bfa;font-size:10px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:5px}
        .lb-empty{text-align:center;padding:24px 16px;opacity:0.3;font-size:12px}
        @media(min-width:600px){
          .lb-wrap{padding:15px}
          .lb-inner{max-width:700px}
          .lb-tabs{gap:8px;padding:4px}
          .lb-tab{font-size:12px;padding:10px 0}
          .lb-rank-card{border-radius:24px;padding:25px 20px}
          .lb-rank-num{font-size:48px}
          .lb-rank-badge{font-size:14px;padding:5px 15px}
          .lb-list-box{border-radius:28px;padding:20px 10px}
          .lb-list-head h3{font-size:18px}
          .lb-list-head span{font-size:12px}
          .lb-item{padding:12px 14px;gap:10px;border-radius:18px}
          .lb-item-rank{width:36px;font-size:15px}
          .lb-item-name{font-size:14px}
          .lb-item-sub{font-size:10px}
          .lb-item-bal-num{font-size:16px}
          .lb-item-bal-label{font-size:9px}
          .lb-item .medal svg{width:28px;height:28px}
        }
      `}</style>
      <div className="lb-bg" />
      <div className="lb-inner">
        {ToastComponent}

        {/* Tabs */}
        <div className="lb-tabs">
          {([
            { key: 'onc' as const, label: 'ONC', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, color: '#22c55e' },
            { key: 'onx' as const, label: 'ONX', icon: <img src="/ONX-logo.png" alt="ONX" style={{ width: 13, height: 13, borderRadius: 3 }} />, color: '#8b5cf6' },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSearch(''); }}
              className={`lb-tab ${tab === t.key ? 'active' : ''}`}
              style={{ color: tab === t.key ? t.color : 'rgba(255,255,255,0.3)' }}
            >
              {t.icon}
              {t.label} Holders
            </button>
          ))}
        </div>

        {/* Rank Card */}
        <div className="lb-rank-card">
          <div className="bg" />
          <div className="lb-rank-label">Global Standing</div>
          <div className="lb-rank-num">
            {currentMyRank ? `#${currentMyRank.toLocaleString()}` : '--'}
          </div>
          <div className="lb-rank-badge" style={{
            color: tab === 'onc' ? '#22c55e' : '#8b5cf6',
            background: tab === 'onc' ? 'rgba(16,185,129,0.1)' : 'rgba(139,92,246,0.1)',
          }}>
            {tab === 'onc' ? (
              <>
                <svg width="13" height="13" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                {formatUSD(currentMyBalance)} ONC
              </>
            ) : (
              <>
                <img src="/ONX-logo.png" alt="ONX" style={{ width: 13, height: 13, borderRadius: 3 }} />
                {currentMyBalance.toFixed(2)} ONX
              </>
            )}
          </div>
        </div>

        {/* List */}
        <div className="lb-list-box">
          <div className="lb-list-head">
            <h3>
              {tab === 'onc' ? (
                <svg width="16" height="16" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              ) : (
                <img src="/ONX-logo.png" alt="ONX" style={{ width: 16, height: 16, borderRadius: 4 }} />
              )}
              Top {tab === 'onc' ? 'Validators' : 'Holders'}
            </h3>
            <span>
              <svg width="10" height="10" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
              {currentTotal.toLocaleString()}
            </span>
          </div>

          {/* Search */}
          <div className="lb-search" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <svg width="13" height="13" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
            />
          </div>

          {/* List */}
          {currentLeaders.length === 0 ? (
            <div className="lb-empty">
              {search ? 'No matches' : tab === 'onc' ? 'No validators' : 'No holders'}
            </div>
          ) : (
            <div>
              {currentLeaders.map((u) => {
                const isMe = uid && u.uid === uid;
                const rank = u._rank;

                let rankNode: React.ReactNode;
                if (rank === 1) rankNode = <div className="medal">{MEDAL_SVG.gold}</div>;
                else if (rank === 2) rankNode = <div className="medal">{MEDAL_SVG.silver}</div>;
                else if (rank === 3) rankNode = <div className="medal">{MEDAL_SVG.bronze}</div>;
                else rankNode = <div className="lb-item-rank">{rank}</div>;

                if (tab === 'onc') {
                  const e = u as OncEntry;
                  const team = (e.refLevel1 || 0) + (e.refLevel2 || 0) + (e.refLevel3 || 0);
                  return (
                    <div key={e.uid} ref={isMe ? myRankRef : undefined} className={`lb-item ${isMe ? 'me' : ''}`}>
                      {rankNode}
                      <div className="lb-item-info">
                        <div className="lb-item-name">{e.name || 'Anonymous'}</div>
                        <div className="lb-item-sub" style={{ color: '#22c55e' }}>
                          <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                          {team}
                        </div>
                      </div>
                      <div className="lb-item-bal">
                        <div className="lb-item-bal-num">{(e.balance || 0).toFixed(2)}</div>
                        <div className="lb-item-bal-label">ONC</div>
                      </div>
                    </div>
                  );
                } else {
                  const e = u as OnxEntry;
                  return (
                    <div key={e.uid} ref={isMe ? myRankRef : undefined} className={`lb-item ${isMe ? 'me' : ''}`}>
                      {rankNode}
                      <div className="lb-item-info">
                        <div className="lb-item-name">{e.name || 'Anonymous'}</div>
                        <div className="lb-item-sub" style={{ color: '#8b5cf6' }}>
                          <img src="/ONX-logo.png" alt="ONX" style={{ width: 9, height: 9, borderRadius: 2 }} />
                          {(e.onxClaimed || 0).toFixed(0)} received
                        </div>
                      </div>
                      <div className="lb-item-bal">
                        <div className="lb-item-bal-num" style={{ color: '#8b5cf6' }}>{(e.onxBalance || 0).toFixed(2)}</div>
                        <div className="lb-item-bal-label">ONX</div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}

          {/* Scroll to me */}
          {currentMyRank && currentMyRank > 10 && (
            <div className="lb-scroll-btn">
              <button onClick={scrollToMe}>
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 16 12 12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                My rank
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
