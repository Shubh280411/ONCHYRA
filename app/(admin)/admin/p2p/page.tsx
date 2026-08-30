'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { detectApiUrl } from '@/lib/utils';

const INTER = "'Inter', sans-serif";
const SG = "'Space Grotesk', sans-serif";

interface Transfer {
  from_uid: string;
  to_uid: string;
  from_code: string;
  to_code: string;
  from_name: string;
  to_name: string;
  gross_amount: number;
  burn: number;
  net_amount: number;
  status: string;
  created_at: number;
}

function fmtDate(ts: number): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function timeAgo(ts: number): string {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function P2PAdminPage() {
  const apiUrl = detectApiUrl();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/p2p-transfers`);
      if (res.ok) {
        const data = await res.json();
        setTransfers(data.transfers);
        setTotal(data.total);
      }
    } catch {}
    setLoading(false);
  }, [apiUrl]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const i = setInterval(load, 15000); return () => clearInterval(i); }, [load]);

  const filtered = transfers.filter(t => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (t.from_name || '').toLowerCase().includes(s) ||
      (t.to_name || '').toLowerCase().includes(s) ||
      (t.from_code || '').toLowerCase().includes(s) ||
      (t.to_code || '').toLowerCase().includes(s);
  });

  const totalVolume = transfers.reduce((s, t) => s + (t.gross_amount || 0), 0);
  const totalBurn = transfers.reduce((s, t) => s + (t.burn || 0), 0);
  const todayCount = transfers.filter(t => t.created_at > Date.now() - 86400000).length;

  return (
    <AdminLayout title="P2P Transfers">
      <div style={{ fontFamily: INTER }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Transfers', value: total, color: '#a78bfa' },
            { label: 'Total Volume', value: `$${totalVolume.toFixed(2)}`, color: '#60a5fa' },
            { label: 'Total Burned', value: `$${totalBurn.toFixed(2)}`, color: '#ef4444' },
            { label: 'Today', value: todayCount, color: '#22c55e' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 14px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: SG, fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <input
          type="text" placeholder="Search by name or code..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 13, fontFamily: INTER, outline: 'none', marginBottom: 16, boxSizing: 'border-box' }}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>No transfers found</div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr 1fr 1.2fr',
              padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)',
              fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)',
            }}>
              <div>From</div><div>To</div><div>Sent</div><div>Burn</div><div>Received</div><div>Status</div><div>Date</div>
            </div>
            {filtered.slice(0, 100).map((t, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr 1fr 1.2fr',
                padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                fontSize: 12, color: 'rgba(255,255,255,0.7)', alignItems: 'center',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{t.from_name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{t.from_code}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{t.to_name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{t.to_code}</div>
                </div>
                <div style={{ fontFamily: SG, fontWeight: 700, color: '#60a5fa' }}>{t.gross_amount?.toFixed(2)}</div>
                <div style={{ fontFamily: SG, fontWeight: 700, color: '#ef4444' }}>-{t.burn?.toFixed(2)}</div>
                <div style={{ fontFamily: SG, fontWeight: 700, color: '#22c55e' }}>{t.net_amount?.toFixed(2)}</div>
                <div>
                  <span style={{
                    padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                    background: t.status === 'completed' ? 'rgba(34,197,94,0.1)' : 'rgba(251,191,36,0.1)',
                    color: t.status === 'completed' ? '#22c55e' : '#fbbf24',
                  }}>{t.status}</span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{fmtDate(t.created_at)}<br/><span style={{ fontSize: 10 }}>{timeAgo(t.created_at)}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
