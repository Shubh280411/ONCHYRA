'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl } from '@/lib/utils';
import Loading from '@/components/ui/Loading';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface PredictionRound {
  id: string;
  symbol?: string;
  segment?: string;
  startPrice?: number;
  endPrice?: number;
  outcome?: string;
  status?: string;
  totalBets?: number;
  totalPool?: number;
}

export default function AdminPredictionsPage() {
  const { uid, loading: authLoading } = useAuth();
  const [allRounds, setAllRounds] = useState<PredictionRound[]>([]);
  const [filterSeg, setFilterSeg] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [totalBets, setTotalBets] = useState(0);
  const [loading, setLoading] = useState(true);
  const { showToast, ToastComponent } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!uid) { router.push('/admin/login'); return; }
    checkAdmin();
  }, [uid, authLoading]);

  async function checkAdmin() {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/check`, { headers: { 'x-auth-uid': uid! } });
      if (!res.ok) { router.push('/admin/login'); return; }
      loadData();
    } catch {
      router.push('/admin/login');
    }
  }

  async function loadData() {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/predictions`, { headers: { 'x-auth-uid': uid! } });
      if (res.ok) {
        const data = await res.json();
        const rounds: PredictionRound[] = Array.isArray(data) ? data.map((r: Record<string, unknown>) => ({
          id: String(r.id || ''),
          symbol: String(r.symbol || ''),
          segment: String(r.segment || ''),
          startPrice: Number(r.startPrice || 0),
          endPrice: r.endPrice ? Number(r.endPrice) : undefined,
          outcome: r.outcome as string | undefined,
          status: String(r.status || ''),
          totalBets: Number(r.totalBets || 0),
          totalPool: Number(r.totalPool || 0),
        })) : [];
        setAllRounds(rounds);
        setTotalBets(rounds.reduce((s, r) => s + (r.totalBets || 0), 0));
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  const filtered = allRounds.filter((r) => {
    if (filterSeg && r.segment !== filterSeg) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  const statActive = allRounds.filter((r) => r.status === 'active').length;
  const statResolved = allRounds.filter((r) => r.status === 'resolved').length;

  if (loading) return <Loading text="Loading predictions..." />;

  return (
    <div className="min-h-screen bg-[var(--bg)] bg-[radial-gradient(ellipse_at_20%_0%,rgba(167,139,250,0.06)_0%,transparent_50%),radial-gradient(ellipse_at_80%_100%,rgba(96,165,250,0.04)_0%,transparent_50%)]">
      <div className="max-w-[1100px] mx-auto p-5 pb-20">
        <div className="flex items-center justify-between p-4 mb-5 bg-white/[0.03] border border-white/[0.08] rounded-[20px]">
          <div className="flex items-center gap-3.5">
            <div className="w-[42px] h-[42px] bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-xl flex items-center justify-center font-[family-name:var(--font-space-grotesk)] font-black text-base text-black">O</div>
            <div className="font-[family-name:var(--font-space-grotesk)] font-extrabold text-lg">ONCHYRA <span className="text-[var(--primary)]">Admin</span></div>
          </div>
          <div className="flex gap-2">
            <a href="/admin" className="px-3.5 py-2 rounded-[10px] text-xs font-bold text-white/70 bg-white/[0.03] border border-transparent hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] hover:border-[var(--primary)]/20 transition-all no-underline">Dashboard</a>
          </div>
        </div>

        <h1 className="font-[family-name:var(--font-space-grotesk)] text-[24px] font-extrabold mb-5">Prediction Rounds</h1>

        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Rounds', val: allRounds.length, color: 'text-[var(--primary)]' },
            { label: 'Active', val: statActive, color: 'text-green-500' },
            { label: 'Resolved', val: statResolved, color: 'text-[var(--secondary)]' },
            { label: 'Total Bets', val: totalBets, color: 'text-pink-400' },
          ].map((s) => (
            <div key={s.label} className="bg-white/[0.03] border border-white/[0.08] rounded-[14px] p-3.5 text-center">
              <div className="text-[9px] font-bold uppercase tracking-wider text-white/35">{s.label}</div>
              <div className={`font-[family-name:var(--font-space-grotesk)] text-[22px] font-extrabold mt-0.5 ${s.color}`}>{s.val}</div>
            </div>
          ))}
        </div>

        <Card>
          <div className="flex items-center gap-2 mb-3 text-sm font-bold font-[family-name:var(--font-space-grotesk)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            All Rounds
          </div>

          <div className="flex gap-2 flex-wrap mb-3.5">
            <select value={filterSeg} onChange={(e) => setFilterSeg(e.target.value)} className="py-2 px-3 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white text-xs outline-none focus:border-[var(--primary)]">
              <option value="">All Segments</option>
              <option value="15min">15 Min</option>
              <option value="1hr">1 Hr</option>
              <option value="1day">1 Day</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="py-2 px-3 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white text-xs outline-none focus:border-[var(--primary)]">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead><tr>{['Round', 'Asset', 'Segment', 'Start Price', 'End Price', 'Outcome', 'Bets', 'Pool'].map((h) => <th key={h} className="text-left py-2.5 px-2 text-[9px] font-bold uppercase tracking-wider text-white/35 border-b border-white/[0.08]">{h}</th>)}</tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-white/30 text-[13px]">No rounds found</td></tr>
                ) : filtered.map((r) => {
                  const outcomeBadge = r.outcome === 'up'
                    ? <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-500/12 text-green-500">UP</span>
                    : r.outcome === 'down'
                    ? <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/12 text-red-500">DOWN</span>
                    : r.status === 'active'
                    ? <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[var(--secondary)]/12 text-[var(--secondary)]">LIVE</span>
                    : <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/5 text-white/35">--</span>;
                  return (
                    <tr key={r.id} className="border-b border-white/[0.03]">
                      <td className="py-2.5 px-2 text-[10px] font-mono">{r.id.slice(0, 16)}...</td>
                      <td className="py-2.5 px-2 font-bold">{r.symbol || '?'}</td>
                      <td className="py-2.5 px-2">{r.segment || '?'}</td>
                      <td className="py-2.5 px-2">${Number(r.startPrice || 0).toFixed(2)}</td>
                      <td className="py-2.5 px-2">{r.endPrice ? `$${Number(r.endPrice).toFixed(2)}` : '--'}</td>
                      <td className="py-2.5 px-2">{outcomeBadge}</td>
                      <td className="py-2.5 px-2">{r.totalBets || 0}</td>
                      <td className="py-2.5 px-2 font-bold">{(r.totalPool || 0).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Button variant="secondary" onClick={loadData} className="mt-3">Refresh</Button>
        </Card>
      </div>
      {ToastComponent}
    </div>
  );
}
