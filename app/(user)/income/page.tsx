'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl, formatTimeAgo } from '@/lib/utils';

interface IncomeItem {
  amt: number;
  src: string;
  detail: string;
  date: number;
  type?: string;
  currency?: string;
}

interface IncomeData {
  commissions: { type: string; amount: number; fromName: string; level: number; packageName: string; createdAt: number }[];
  achievements: { amount: number; rank: string; createdAt: number }[];
  rewards: { amount: number; rank: string; day: number; createdAt: number }[];
  claims: { amount: number; created_at: number }[];
  onxDistributions: { user_name: string; signup_onx: number; l1_count: number; l1_onx: number; l2_count: number; l2_onx: number; l3_count: number; l3_onx: number; total_onx: number; created_at: number }[];
}

type TabType = 'referral' | 'leadership' | 'matching' | 'onc' | 'onx';
type FilterType = '24h' | '7d' | '30d' | 'all';

const TAB_CONFIG: { key: TabType; label: string; color: string; icon: React.ReactNode }[] = [
  { key: 'onc', label: 'ONC', color: '#60a5fa', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 10l4-4 4 4M8 14l4 4 4-4"/></svg> },
  { key: 'onx', label: 'ONX', color: '#a78bfa', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { key: 'referral', label: 'USDT Referral', color: '#22c55e', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M12 20v-6"/><path d="M6 20v-4"/><path d="M18 20v-8"/><path d="M2 20h20"/></svg> },
  { key: 'leadership', label: 'Leadership', color: '#fbbf24', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { key: 'matching', label: 'Matching', color: '#f59e0b', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
];

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

  const [data, setData] = useState<IncomeData>({ commissions: [], achievements: [], rewards: [], claims: [], onxDistributions: [] });
  const [tab, setTab] = useState<TabType>('onc');
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);

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

  // ONC Claims total
  const oncTotal = useMemo(() => {
    let t = 0;
    data.claims.forEach(c => t += c.amount || 0);
    return t;
  }, [data]);

  // ONX total from distributions
  const onxTotal = useMemo(() => {
    let t = 0;
    data.onxDistributions.forEach(d => t += d.total_onx || 0);
    return t;
  }, [data]);

  // USDT referral total
  const refUsdt = useMemo(() => {
    let t = 0;
    data.commissions.forEach(c => { if (c.type === 'package_commission') t += c.amount || 0; });
    return t;
  }, [data]);

  // Leadership total
  const leadTotal = useMemo(() => {
    let t = 0;
    data.achievements.forEach(c => t += c.amount || 0);
    data.rewards.forEach(c => t += c.amount || 0);
    return t;
  }, [data]);

  // Matching total
  const matchTotal = useMemo(() => {
    let t = 0;
    data.commissions.forEach(c => { if (c.type === 'matching_bonus') t += c.amount || 0; });
    return t;
  }, [data]);

  const items = useMemo<IncomeItem[]>(() => {
    const list: IncomeItem[] = [];

    if (tab === 'onc') {
      data.claims.forEach(c => {
        list.push({ amt: c.amount, src: 'Daily Claim', detail: 'Mining reward', date: c.created_at, currency: 'ONC' });
      });
    } else if (tab === 'onx') {
      data.onxDistributions.forEach(d => {
        if (d.signup_onx > 0) list.push({ amt: d.signup_onx, src: 'Self Signup', detail: 'Welcome bonus', date: d.created_at, currency: 'ONX' });
        if (d.l1_onx > 0) list.push({ amt: d.l1_onx, src: d.user_name || 'User', detail: `Level 1 (${d.l1_count} refer${d.l1_count > 1 ? 's' : ''})`, date: d.created_at, currency: 'ONX' });
        if (d.l2_onx > 0) list.push({ amt: d.l2_onx, src: d.user_name || 'User', detail: `Level 2 (${d.l2_count} refer${d.l2_count > 1 ? 's' : ''})`, date: d.created_at, currency: 'ONX' });
        if (d.l3_onx > 0) list.push({ amt: d.l3_onx, src: d.user_name || 'User', detail: `Level 3 (${d.l3_count} refer${d.l3_count > 1 ? 's' : ''})`, date: d.created_at, currency: 'ONX' });
      });
    } else if (tab === 'referral') {
      data.commissions.forEach(c => {
        if (c.type === 'package_commission') {
          list.push({ amt: c.amount, src: c.fromName || 'User', detail: `L${c.level} - ${c.packageName || ''}`, date: c.createdAt, currency: 'USDT', type: c.type });
        }
      });
    } else if (tab === 'leadership') {
      data.achievements.forEach(c => list.push({ amt: c.amount, src: c.rank || 'Rank', detail: 'Achievement Bonus', date: c.createdAt, currency: 'USDT' }));
      data.rewards.forEach(c => list.push({ amt: c.amount, src: c.rank || 'Rank', detail: `Day ${c.day || ''} Reward`, date: c.createdAt, currency: 'USDT' }));
    } else if (tab === 'matching') {
      data.commissions.forEach(c => {
        if (c.type === 'matching_bonus') list.push({ amt: c.amount, src: c.fromName || 'User', detail: 'Matching Bonus', date: c.createdAt, currency: 'USDT', type: c.type });
      });
    }

    list.sort((a, b) => (b.date || 0) - (a.date || 0));
    if (filter !== 'all') return list.filter(i => isInRange(i.date));
    return list;
  }, [data, tab, filter]);

  const total = useMemo(() => items.reduce((s, i) => s + (i.amt || 0), 0), [items]);

  const tabCurrency = tab === 'onc' ? 'ONC' : tab === 'onx' ? 'ONX' : 'USDT';

  const summaryCards = [
    { label: 'ONC Mined', value: oncTotal.toFixed(2), currency: 'ONC', color: '#60a5fa' },
    { label: 'ONX Earned', value: onxTotal.toFixed(2), currency: 'ONX', color: '#a78bfa' },
    { label: 'USDT Referral', value: refUsdt.toFixed(2), currency: 'USDT', color: '#22c55e' },
    { label: 'Leadership', value: leadTotal.toFixed(2), currency: 'USDT', color: '#fbbf24' },
    { label: 'Matching', value: matchTotal.toFixed(2), currency: 'USDT', color: '#f59e0b' },
  ];

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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60 }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.05)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Loading your income...</div>
      </div>
    );
  }

  const tabInfo = TAB_CONFIG.find(t => t.key === tab);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {ToastComponent}

      <div>
        <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 800, fontSize: 22, margin: '4px 0 2px' }}>Income</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Your earnings overview</div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        {summaryCards.map((s, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, textAlign: 'center', padding: '12px 6px' }}>
            <div style={{ fontSize: 7, opacity: 0.35, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ fontWeight: 800, fontSize: 13, color: s.color, fontFamily: "'Space Grotesk'", marginTop: 3 }}>
              {s.value} <span style={{ fontSize: 9, opacity: 0.6 }}>{s.currency}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: 4, overflowX: 'auto' }}>
        {TAB_CONFIG.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: 10, textAlign: 'center', borderRadius: 11, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: '0.2s', border: 'none', whiteSpace: 'nowrap' as const,
            color: tab === t.key ? t.color : 'rgba(255,255,255,0.3)',
            background: tab === t.key ? `${t.color}18` : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '5px 12px', borderRadius: 10, fontSize: 9, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.5, border: '1px solid transparent',
            color: filter === f.key ? tabInfo?.color || '#a78bfa' : 'rgba(255,255,255,0.3)',
            background: filter === f.key ? `${tabInfo?.color || '#a78bfa'}18` : 'rgba(255,255,255,0.03)',
            borderColor: filter === f.key ? `${tabInfo?.color || '#a78bfa'}30` : 'transparent',
          }}>{f.label}</button>
        ))}
      </div>

      {/* Total */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, textAlign: 'center', padding: 20 }}>
        <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 900, fontSize: 32, color: tabInfo?.color || '#a78bfa' }}>
          {total.toFixed(2)} <span style={{ fontSize: 16, opacity: 0.6 }}>{tabCurrency}</span>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
          Total {tabInfo?.label || tab} Income
        </div>
      </div>

      {/* Income List */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, overflow: 'hidden' }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>
            <svg width="32" height="32" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round" viewBox="0 0 24 24" style={{ margin: '0 auto 12px' }}><path d="M12 20v-6"/><path d="M6 20v-4"/><path d="M18 20v-8"/><path d="M2 20h20"/></svg>
            No {tabInfo?.label || tab} income yet
          </div>
        ) : (
          items.map((item, i) => {
            const color = tabInfo?.color || '#a78bfa';
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {tabInfo?.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color }}>
                      +{(item.amt || 0).toFixed(item.currency === 'USDT' ? 2 : 4)} {item.currency || 'USDT'}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{item.src} — {item.detail}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>{item.date ? formatTimeAgo(item.date) : ''}</div>
                  <div style={{ fontSize: 9, color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                    <svg width="8" height="8" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    Completed
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
