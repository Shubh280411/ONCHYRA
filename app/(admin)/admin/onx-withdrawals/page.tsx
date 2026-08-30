'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { detectApiUrl } from '@/lib/utils';

const INTER = "'Inter', sans-serif";
const SG = "'Space Grotesk', sans-serif";

interface Withdrawal {
  id: string;
  uid: string;
  name: string;
  email: string;
  address: string;
  amount: number;
  status: string;
  tx_hash: string | null;
  created_at: number;
  completed_at: number | null;
}

function timeAgo(ts: number): string {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function fmtDate(ts: number): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  completed: { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', text: '#22c55e' },
  failed: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', text: '#ef4444' },
  processing: { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)', text: '#fbbf24' },
};

export default function OnxWithdrawalsPage() {
  const apiUrl = detectApiUrl();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/onx-withdrawals?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch {}
    setLoading(false);
  }, [apiUrl, filter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const i = setInterval(load, 15000); return () => clearInterval(i); }, [load]);

  const stats = {
    total: withdrawals.length,
    completed: withdrawals.filter(w => w.status === 'completed').length,
    failed: withdrawals.filter(w => w.status === 'failed').length,
    processing: withdrawals.filter(w => w.status === 'processing').length,
    totalVolume: withdrawals.filter(w => w.status === 'completed').reduce((s, w) => s + w.amount, 0),
  };

  return (
    <AdminLayout title="ONX Withdrawals">
      <div style={{ fontFamily: INTER }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total', value: stats.total, color: '#a78bfa' },
            { label: 'Completed', value: stats.completed, color: '#22c55e' },
            { label: 'Failed', value: stats.failed, color: '#ef4444' },
            { label: 'Processing', value: stats.processing, color: '#fbbf24' },
            { label: 'Volume (ONX)', value: stats.totalVolume.toFixed(2), color: '#60a5fa' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 12px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: SG, fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {['all', 'completed', 'failed', 'processing'].map(f => (
            <button key={f} onClick={() => { setFilter(f); setLoading(true); }} style={{
              padding: '8px 16px', borderRadius: 10, border: filter === f ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
              background: filter === f ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.02)', color: filter === f ? '#a78bfa' : 'rgba(255,255,255,0.4)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: INTER, textTransform: 'capitalize' as const,
            }}>{f}</button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>Loading...</div>
        ) : withdrawals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No ONX withdrawals found</div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '50px 1.5fr 1.5fr 1fr 1fr 1.5fr 1.2fr', padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)' }}>
              <div>#</div><div>User</div><div>Wallet</div><div>Amount</div><div>Status</div><div>TX Hash</div><div>Date</div>
            </div>

            {/* Rows */}
            {withdrawals.map((w, i) => {
              const sc = STATUS_COLORS[w.status] || STATUS_COLORS.processing;
              return (
                <div key={w.id} style={{ display: 'grid', gridTemplateColumns: '50px 1.5fr 1.5fr 1fr 1fr 1.5fr 1.2fr', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12, color: 'rgba(255,255,255,0.7)', alignItems: 'center', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <div style={{ fontFamily: SG, fontWeight: 800, color: 'rgba(255,255,255,0.3)' }}>{i + 1}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{w.name}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{w.email}</div>
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', wordBreak: 'break-all' }}>
                    {w.address.slice(0, 6)}...{w.address.slice(-4)}
                  </div>
                  <div style={{ fontFamily: SG, fontWeight: 700, color: '#60a5fa' }}>{w.amount} ONX</div>
                  <div>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 8, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text, fontSize: 10, fontWeight: 700, textTransform: 'capitalize' as const }}>
                      {w.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, fontFamily: 'monospace', color: w.tx_hash ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)' }}>
                    {w.tx_hash ? (
                      <a href={`https://polygonscan.com/tx/${w.tx_hash}`} target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa', textDecoration: 'none' }}>
                        {w.tx_hash.slice(0, 8)}...{w.tx_hash.slice(-4)}
                      </a>
                    ) : '—'}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                    <div>{fmtDate(w.created_at)}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{timeAgo(w.created_at)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
