'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { detectApiUrl } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';

interface WalletData {
  id: string;
  uid: string;
  network: string;
  address: string;
  used: boolean;
  swept: boolean;
  sweep_tx: string | null;
  created_at: number;
}

const S = {
  card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 },
};

export default function AdminDepositsPage() {
  const { uid } = useAuth();
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [sweepTab, setSweepTab] = useState<'all' | 'pending' | 'swept'>('all');
  const [loading, setLoading] = useState(true);

  const loadWallets = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/wallets`, { headers: { 'x-auth-uid': uid } });
      if (res.ok) {
        const data = await res.json();
        setWallets(data.wallets || []);
      }
    } catch {}
    setLoading(false);
  }, [uid]);

  useEffect(() => { loadWallets(); }, [loadWallets]);
  useEffect(() => { const t = setInterval(loadWallets, 15000); return () => clearInterval(t); }, [loadWallets]);

  const usedNotSwept = wallets.filter(w => w.used && !w.swept).length;
  const totalSwept = wallets.filter(w => w.swept).length;

  return (
    <AdminLayout title="Auto Sweep Status">
      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Wallets', value: wallets.length, color: '#a78bfa' },
          { label: 'Pending Sweep', value: usedNotSwept, color: '#fbbf24' },
          { label: 'Swept', value: totalSwept, color: '#22c55e' },
        ].map((s, i) => (
          <div key={i} style={{ ...S.card, flex: '1 1 140px', minWidth: 140 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Auto Sweep Info */}
      <div style={{ ...S.card, marginBottom: 20, background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.1)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e', marginBottom: 6 }}>Fully Automatic</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
          Sweep is automatic. When a deposit is detected in a child wallet, the system auto-sends gas (for USDT) and sweeps funds to master wallet instantly. No manual action required.
        </div>
      </div>

      {/* Wallet List */}
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Wallets</div>
          <button onClick={loadWallets} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['all', 'pending', 'swept'] as const).map(tab => (
            <button key={tab} onClick={() => setSweepTab(tab)} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', fontSize: 12, cursor: 'pointer', background: sweepTab === tab ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.03)', color: sweepTab === tab ? '#a78bfa' : 'rgba(255,255,255,0.3)', textTransform: 'capitalize' as const }}>
              {tab === 'all' ? 'All' : tab === 'pending' ? 'Not Swept' : 'Swept'}
            </button>
          ))}
        </div>

        <div style={{ maxHeight: 500, overflowY: 'auto' }}>
          {wallets
            .filter(w => sweepTab === 'all' ? true : sweepTab === 'pending' ? !w.swept : w.swept)
            .map(w => {
              const isPol = w.network === 'Polygon';
              const networkColor = isPol ? '#8247e5' : '#f0b90b';
              return (
                <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, marginBottom: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${networkColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src={isPol ? "https://cryptologos.cc/logos/polygon-matic-logo.svg" : "https://cryptologos.cc/logos/tether-usdt-logo.svg"} alt={w.network} width="20" height="20" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{w.address}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                      {w.network} {w.swept ? <span style={{ color: '#22c55e' }}>Swept</span> : w.used ? <span style={{ color: '#fbbf24' }}>Pending</span> : <span style={{ color: 'rgba(255,255,255,0.2)' }}>Unused</span>}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {w.swept && w.sweep_tx && (
                      <a href={isPol ? `https://polygonscan.com/tx/${w.sweep_tx}` : `https://bscscan.com/tx/${w.sweep_tx}`} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontSize: 11, textDecoration: 'none', fontWeight: 600 }}>
                        View TX
                      </a>
                    )}
                    {w.used && !w.swept && (
                      <span style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(251,191,36,0.1)', color: '#fbbf24', fontSize: 11, fontWeight: 600 }}>
                        Waiting...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </AdminLayout>
  );
}
