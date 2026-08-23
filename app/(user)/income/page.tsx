'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl, formatTimeAgo, formatUSD } from '@/lib/utils';
import Loading from '@/components/ui/Loading';

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

  if (loading) return <Loading text="Loading your income..." />;

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Inter',sans-serif", background: '#03040a', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px', backgroundImage: 'radial-gradient(ellipse at 50% 0%,rgba(167,139,250,0.06) 0%,transparent 60%)' }}>
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
        <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 800, fontSize: 22, margin: '4px 0 2px' }}>Income</h1>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: -2 }}>Your earnings overview</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: 4 }}>
          {([['referral', 'Referral'], ['leadership', 'Leadership'], ['matching', 'Matching']] as const).map(([key, lbl]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, padding: 10, textAlign: 'center', borderRadius: 11, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: '0.2s',
                color: tab === key ? '#a78bfa' : 'rgba(255,255,255,0.3)',
                background: tab === key ? 'rgba(167,139,250,0.12)' : 'transparent',
                border: 'none',
              }}
            >
              {lbl}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, textAlign: 'center', padding: '14px 8px', backdropFilter: 'blur(20px)' }}>
            <div style={{ fontSize: 7, opacity: 0.35, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Referral</div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#a78bfa', fontFamily: "'Space Grotesk'", marginTop: 3 }}>
              {refUsdt > 0 ? formatUSD(refUsdt) : ''}{refOnc > 0 ? `${refUsdt > 0 ? ' ' : ''}${refOnc.toFixed(2)} ONC` : refUsdt === 0 ? '$0' : ''}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, textAlign: 'center', padding: '14px 8px', backdropFilter: 'blur(20px)' }}>
            <div style={{ fontSize: 7, opacity: 0.35, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Leadership</div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#fbbf24', fontFamily: "'Space Grotesk'", marginTop: 3 }}>{formatUSD(leadTotal)}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, textAlign: 'center', padding: '14px 8px', backdropFilter: 'blur(20px)' }}>
            <div style={{ fontSize: 7, opacity: 0.35, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Matching</div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#22c55e', fontFamily: "'Space Grotesk'", marginTop: 3 }}>{formatUSD(matchTotal)}</div>
          </div>
        </div>

        {/* Time Filters */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          {(['24h', '7d', '30d', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '5px 12px', borderRadius: 10, fontSize: 9, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.5, border: '1px solid transparent',
                color: filter === f ? '#a78bfa' : 'rgba(255,255,255,0.3)',
                background: filter === f ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.03)',
                borderColor: filter === f ? 'rgba(167,139,250,0.2)' : 'transparent',
              }}
            >
              {f === 'all' ? 'ALL' : f.toUpperCase()}
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
            <div style={{ textAlign: 'center', padding: 40, fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>No income yet</div>
          ) : (
            items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>+{item.type === 'registration_bonus' ? '' : '$'}{(item.amt || 0).toFixed(2)}{item.type === 'registration_bonus' ? ' ONC' : ''}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{item.src} · {item.detail}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>{item.date ? formatTimeAgo(item.date) : ''}</div>
                  <div style={{ fontSize: 9, color: '#22c55e' }}>Completed</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
