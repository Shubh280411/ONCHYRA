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
    <div className="min-h-screen px-4 py-5 max-w-md mx-auto flex flex-col gap-3.5">
      {ToastComponent}

      {/* Header */}
      <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3.5">
        <Link href="/dashboard" className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06] text-white shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
        </Link>
        <span className="font-[family-name:var(--font-space-grotesk)] font-black text-lg bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent flex-1">
          ONCHYRA
        </span>
        <div className="w-9" />
      </div>

      {/* Title */}
      <h1 className="font-[family-name:var(--font-space-grotesk)] font-extrabold text-xl">Income</h1>
      <p className="text-white/40 text-xs -mt-2">Your earnings overview</p>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-white/[0.02] rounded-xl p-1">
        {([['referral', 'Referral'], ['leadership', 'Leadership'], ['matching', 'Matching']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2.5 rounded-lg text-[11px] font-bold transition-all ${
              tab === key ? 'bg-purple-500/[0.12] text-[var(--primary)]' : 'text-white/30'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl text-center p-3.5">
          <div className="text-[7px] text-white/35 font-bold tracking-wider uppercase">Referral</div>
          <div className="font-[family-name:var(--font-space-grotesk)] font-extrabold text-sm text-[var(--primary)] mt-1">
            {refUsdt > 0 ? formatUSD(refUsdt) : ''}{refOnc > 0 ? `${refUsdt > 0 ? ' ' : ''}${refOnc.toFixed(2)} ONC` : refUsdt === 0 ? '$0' : ''}
          </div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl text-center p-3.5">
          <div className="text-[7px] text-white/35 font-bold tracking-wider uppercase">Leadership</div>
          <div className="font-[family-name:var(--font-space-grotesk)] font-extrabold text-sm text-yellow-400 mt-1">{formatUSD(leadTotal)}</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl text-center p-3.5">
          <div className="text-[7px] text-white/35 font-bold tracking-wider uppercase">Matching</div>
          <div className="font-[family-name:var(--font-space-grotesk)] font-extrabold text-sm text-green-400 mt-1">{formatUSD(matchTotal)}</div>
        </div>
      </div>

      {/* Time Filters */}
      <div className="flex gap-1.5 justify-end">
        {(['24h', '7d', '30d', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold tracking-wider transition-all ${
              filter === f ? 'text-[var(--primary)] bg-purple-500/10 border border-purple-500/20' : 'text-white/30 bg-white/[0.03] border border-transparent'
            }`}
          >
            {f === 'all' ? 'ALL' : f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Total */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl text-center py-6">
        <div className="font-[family-name:var(--font-space-grotesk)] font-black text-4xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
          {total.toFixed(2)}
        </div>
        <div className="text-[10px] text-white/25 uppercase tracking-widest mt-1">{label}</div>
      </div>

      {/* Income List */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        {items.length === 0 ? (
          <div className="py-10 text-center text-xs text-white/15">No income yet</div>
        ) : (
          items.map((item, i) => (
            <div key={i} className="flex justify-between items-center px-4 py-3.5 border-b border-white/[0.03] last:border-b-0 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="text-[13px] font-bold">+{item.type === 'registration_bonus' ? '' : '$'}{(item.amt || 0).toFixed(2)}{item.type === 'registration_bonus' ? ' ONC' : ''}</div>
                <div className="text-[10px] text-white/30">{item.src} &middot; {item.detail}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-white/20">{item.date ? formatTimeAgo(item.date) : ''}</div>
                <div className="text-[9px] text-green-400">Completed</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
