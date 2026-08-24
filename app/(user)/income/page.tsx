'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl, formatTimeAgo, formatUSD } from '@/lib/utils';

interface IncomeItem {
  amt: number;
  src: string;
  detail: string;
  date: number;
  type?: string;
}

interface IncomeData {
  commissions: { type: string; amount: number; fromName: string; level: number; packageName: string; createdAt: number }[];
  achievements: { amount: number; rank: string; createdAt: number }[];
  rewards: { amount: number; rank: string; day: number; createdAt: number }[];
}

type TabType = 'referral' | 'leadership' | 'matching';
type FilterType = '24h' | '7d' | '30d' | 'all';

const REFERRAL_ICON = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20v-6" /><path d="M6 20v-4" /><path d="M18 20v-8" /><path d="M2 20h20" /><path d="M2 14l4-4 4 4 6-6 4 4" />
  </svg>
);

const LEADERSHIP_ICON = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const MATCHING_ICON = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const FILTERS: { key: FilterType; label: string }[] = [
  { key: '24h', label: '24H' },
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: 'all', label: 'ALL' },
];

export default function IncomePage() {
  const { uid } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const apiUrl = detectApiUrl();

  const [data, setData] = useState<IncomeData>({ commissions: [], achievements: [], rewards: [] });
  const [tab, setTab] = useState<TabType>('referral');
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);

  const refOnc = useMemo(() => {
    let onc = 0;
    data.commissions.forEach(c => { if (c.type === 'registration_bonus') onc += c.amount || 0; });
    return onc;
  }, [data]);

  const refUsdt = useMemo(() => {
    let usdt = 0;
    data.commissions.forEach(c => { if (c.type === 'package_commission') usdt += c.amount || 0; });
    return usdt;
  }, [data]);

  const leadTotal = useMemo(() => {
    let t = 0;
    data.achievements.forEach(c => t += c.amount || 0);
    return t;
  }, [data]);

  const matchTotal = useMemo(() => {
    let t = 0;
    data.commissions.forEach(c => { if (c.type === 'matching_bonus') t += c.amount || 0; });
    return t;
  }, [data]);

  function getTimeCutoff(): number {
    const now = Date.now();
    if (filter === '24h') return now - 86400000;
    if (filter === '7d') return now - 7 * 86400000;
    if (filter === '30d') return now - 30 * 86400000;
    return 0;
  }

  function isInRange(ts: number): boolean {
    const cutoff = getTimeCutoff();
    if (cutoff === 0) return true;
    return ts >= cutoff;
  }

  const items = useMemo<IncomeItem[]>(() => {
    const list: IncomeItem[] = [];
    if (tab === 'referral') {
      data.commissions.forEach(c => {
        if (c.type === 'package_commission' || c.type === 'registration_bonus') {
          list.push({ amt: c.amount, src: c.fromName || 'User', detail: c.type === 'registration_bonus' ? `Registration L${c.level}` : `L${c.level} - ${c.packageName || ''}`, date: c.createdAt, type: c.type });
        }
      });
    } else if (tab === 'leadership') {
      data.achievements.forEach(c => list.push({ amt: c.amount, src: c.rank || 'Rank', detail: 'Achievement Bonus', date: c.createdAt }));
      data.rewards.forEach(c => list.push({ amt: c.amount, src: c.rank || 'Rank', detail: `Day ${c.day || ''} Reward`, date: c.createdAt }));
    } else if (tab === 'matching') {
      data.commissions.forEach(c => {
        if (c.type === 'matching_bonus') list.push({ amt: c.amount, src: c.fromName || 'User', detail: 'Matching Bonus', date: c.createdAt, type: c.type });
      });
    }
    list.sort((a, b) => (b.date || 0) - (a.date || 0));
    if (filter !== 'all') return list.filter(i => isInRange(i.date));
    return list;
  }, [data, tab, filter]);

  const total = useMemo(() => items.reduce((s, i) => s + (i.amt || 0), 0), [items]);

  const label = tab === 'referral' ? 'Total Referral Income' : tab === 'leadership' ? 'Total Leadership Income' : 'Total Matching Bonus';

  useEffect(() => {
    if (!uid) return;
    loadData();
  }, [uid]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/income/${uid}`);
      if (res.ok) setData(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }

  if (loading) {
    return (
      <div style={{ fontFamily: "'Inter',sans-serif", background: '#03040a', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px', backgroundImage: 'radial-gradient(ellipse at 50% 0%,rgba(167,139,250,0.06) 0%,transparent 60%)' }}>
        <div style={{ width: '100%', maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', paddingTop: 60 }}>
          <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.05)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Loading your income...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: '#03040a', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px', backgroundImage: 'radial-gradient(ellipse at 50% 0%,rgba(167,139,250,0.06) 0%,transparent 60%)' }}>
      <div style={{ width: '100%', maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {ToastComponent}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 22, padding: '14px 16px' }}>
          <Link href="/dashboard" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, cursor: 'pointer', color: 'white', textDecoration: 'none', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
          </Link>
          <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 900, fontSize: 18, background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', flex: 1 }}>
            ONCHYRA
          </span>
          <div style={{ width: 36 }} />
        </div>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 800, fontSize: 22, margin: '4px 0 2px' }}>Income</div>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: -8 }}>Your earnings overview</div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: 4 }}>
          {([
            { key: 'referral' as TabType, label: 'Referral', icon: REFERRAL_ICON },
            { key: 'leadership' as TabType, label: 'Leadership', icon: LEADERSHIP_ICON },
            { key: 'matching' as TabType, label: 'Matching', icon: MATCHING_ICON },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: 10, textAlign: 'center', borderRadius: 11, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: '0.2s', border: 'none',
                color: tab === t.key ? '#a78bfa' : 'rgba(255,255,255,0.3)',
                background: tab === t.key ? 'rgba(167,139,250,0.12)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, textAlign: 'center', padding: '14px 8px', backdropFilter: 'blur(20px)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 4 }}><path d="M12 20v-6" /><path d="M6 20v-4" /><path d="M18 20v-8" /><path d="M2 20h20" /><path d="M2 14l4-4 4 4 6-6 4 4" /></svg>
            <div style={{ fontSize: 7, opacity: 0.35, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Referral</div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#a78bfa', fontFamily: "'Space Grotesk'", marginTop: 3 }}>
              {refUsdt > 0 ? formatUSD(refUsdt) : ''}{refOnc > 0 ? `${refUsdt > 0 ? ' ' : ''}${refOnc.toFixed(2)} ONC` : refUsdt === 0 ? '$0' : ''}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, textAlign: 'center', padding: '14px 8px', backdropFilter: 'blur(20px)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 4 }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            <div style={{ fontSize: 7, opacity: 0.35, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Leadership</div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#fbbf24', fontFamily: "'Space Grotesk'", marginTop: 3 }}>{formatUSD(leadTotal)}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, textAlign: 'center', padding: '14px 8px', backdropFilter: 'blur(20px)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 4 }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            <div style={{ fontSize: 7, opacity: 0.35, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Matching</div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#22c55e', fontFamily: "'Space Grotesk'", marginTop: 3 }}>{formatUSD(matchTotal)}</div>
          </div>
        </div>

        {/* Time Filters */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '5px 12px', borderRadius: 10, fontSize: 9, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.5, border: '1px solid transparent',
                color: filter === f.key ? '#a78bfa' : 'rgba(255,255,255,0.3)',
                background: filter === f.key ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.03)',
                borderColor: filter === f.key ? 'rgba(167,139,250,0.2)' : 'transparent',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Total */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, textAlign: 'center', padding: 24, backdropFilter: 'blur(20px)' }}>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 900, fontSize: 36, background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {total.toFixed(2)}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{label}</div>
        </div>

        {/* Income List */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 0, backdropFilter: 'blur(20px)' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>
              <svg width="32" height="32" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round" viewBox="0 0 24 24" style={{ margin: '0 auto 12px' }}><path d="M12 20v-6" /><path d="M6 20v-4" /><path d="M18 20v-8" /><path d="M2 20h20" /><path d="M2 14l4-4 4 4 6-6 4 4" /></svg>
              No income yet
            </div>
          ) : (
            items.map((item, i) => {
              const iconSvg = tab === 'referral' ? REFERRAL_ICON : tab === 'leadership' ? LEADERSHIP_ICON : MATCHING_ICON;
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: tab === 'referral' ? 'rgba(167,139,250,0.1)' : tab === 'leadership' ? 'rgba(251,191,36,0.1)' : 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {iconSvg}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>+{item.type === 'registration_bonus' ? '' : '$'}{(item.amt || 0).toFixed(2)}{item.type === 'registration_bonus' ? ' ONC' : ''}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{item.src} - {item.detail}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>{item.date ? formatTimeAgo(item.date) : ''}</div>
                    <div style={{ fontSize: 9, color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                      <svg width="8" height="8" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                      Completed
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
