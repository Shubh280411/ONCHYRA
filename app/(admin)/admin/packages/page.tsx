'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { detectApiUrl } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';

interface PackageTier {
  id: string;
  name: string;
  price: number;
  boost: number;
  cap: number;
  color: string;
  gradient: string;
}

interface Stats {
  totalUsers: number;
  packageBreakdown: { name: string; count: number; revenue: number }[];
  users: Record<string, unknown>[];
}

const PACKAGES: PackageTier[] = [
  { id: 'starter', name: 'Starter', price: 5, boost: 4, cap: 50, color: '#60a5fa', gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)' },
  { id: 'builder', name: 'Builder', price: 10, boost: 8, cap: 100, color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
  { id: 'pioneer', name: 'Pioneer', price: 25, boost: 15, cap: 250, color: '#fbbf24', gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)' },
  { id: 'elite', name: 'Elite', price: 50, boost: 30, cap: 500, color: '#a78bfa', gradient: 'linear-gradient(135deg, #a78bfa, #8b5cf6)' },
  { id: 'titan', name: 'Titan', price: 100, boost: 60, cap: 1000, color: '#f472b6', gradient: 'linear-gradient(135deg, #f472b6, #ec4899)' },
  { id: 'dominion', name: 'Dominion', price: 250, boost: 120, cap: 2500, color: '#fb923c', gradient: 'linear-gradient(135deg, #fb923c, #f97316)' },
  { id: 'legacy', name: 'Legacy', price: 500, boost: 300, cap: 5000, color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
];

const S = {
  card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 },
  input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: "'Inter',sans-serif" },
  btn: { padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: "'Inter',sans-serif" as const, transition: 'all 0.2s' },
};

export default function AdminPackagesPage() {
  const { uid } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPkg, setSelectedPkg] = useState('starter');
  const [activating, setActivating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
  const [promoActive, setPromoActive] = useState(false);

  const showToast = (msg: string, err = false) => { setToast({ msg, err }); setTimeout(() => setToast(null), 3000); };

  const loadStats = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/stats`, { headers: { 'x-auth-uid': uid } });
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalUsers: data.totalUsers || 0,
          packageBreakdown: data.packageBreakdown || [],
          users: data.users || [],
        });
      }
      const promoRes = await fetch(`${apiUrl}/api/admin/starter-promo/toggle`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! }, body: JSON.stringify({ active: false }) });
      if (promoRes.ok) {
        const promoData = await promoRes.json();
        setPromoActive(promoData.config?.active || false);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [uid]);

  useEffect(() => { loadStats(); }, [loadStats]);

  async function handleActivate() {
    if (!search.trim()) { showToast('Enter a user UID or email', true); return; }
    setActivating(true);
    try {
      const apiUrl = detectApiUrl();
      const users = stats?.users || [];
      const found = users.find((u: Record<string, unknown>) =>
        String(u.uid) === search.trim() || String(u.email).toLowerCase() === search.trim().toLowerCase()
      );
      if (!found) { showToast('User not found', true); setActivating(false); return; }

      const res = await fetch(`${apiUrl}/api/admin/package/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({ uid: String(found.uid), packageId: selectedPkg }),
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`Activated ${data.package} for ${found.name || found.email}`);
        setSearch('');
        loadStats();
      } else {
        const err = await res.json();
        showToast(err.error || 'Activation failed', true);
      }
    } catch { showToast('Network error', true); }
    setActivating(false);
  }

  async function togglePromo() {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/starter-promo/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({ active: !promoActive }),
      });
      if (res.ok) {
        setPromoActive(!promoActive);
        showToast(`Starter Promo ${!promoActive ? 'activated' : 'deactivated'}`);
      }
    } catch { showToast('Toggle failed', true); }
  }

  const totalRevenue = stats?.packageBreakdown?.reduce((s, p) => s + p.revenue, 0) || 0;
  const totalSold = stats?.packageBreakdown?.reduce((s, p) => s + p.count, 0) || 0;

  return (
    <AdminLayout title="Package Management">
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '14px 24px', borderRadius: 12, background: toast.err ? 'rgba(239,68,68,0.9)' : 'rgba(34,197,94,0.9)', color: '#fff', fontSize: 14, fontWeight: 600, backdropFilter: 'blur(12px)' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Packages Sold', value: totalSold, color: '#a78bfa' },
          { label: 'Total Revenue', value: `${totalRevenue.toFixed(2)} ONC`, color: '#22c55e' },
          { label: 'Total Users', value: stats?.totalUsers || '...', color: '#60a5fa' },
        ].map((s, i) => (
          <div key={i} style={{ ...S.card, flex: '1 1 180px', minWidth: 180 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</div>
          </div>
        ))}
      </div>

      {/* Package Tier Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        {PACKAGES.map(pkg => {
          const bd = stats?.packageBreakdown?.find(b => b.name.toLowerCase() === pkg.name.toLowerCase());
          const count = bd?.count || 0;
          const revenue = bd?.revenue || 0;
          const pct = totalSold > 0 ? (count / totalSold) * 100 : 0;

          return (
            <div key={pkg.id} style={{ ...S.card, padding: 18, cursor: 'pointer', borderColor: selectedPkg === pkg.id ? pkg.color + '60' : undefined, background: selectedPkg === pkg.id ? pkg.color + '10' : undefined }} onClick={() => setSelectedPkg(pkg.id)}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: pkg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{pkg.name}</div>
              <div style={{ fontSize: 12, color: pkg.color, marginBottom: 8 }}>${pkg.price} / {pkg.boost}x</div>

              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: pkg.gradient, borderRadius: 2, transition: 'width 0.5s' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>{count} users</span>
                <span style={{ color: '#22c55e' }}>{revenue.toFixed(1)} ONC</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Activate Package */}
        <div style={S.card}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#fff' }}>Activate Package</div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>User UID or Email</label>
            <input style={S.input} value={search} onChange={e => setSearch(e.target.value)} placeholder="Enter user identifier..." />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Package Tier</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PACKAGES.map(p => (
                <button key={p.id} onClick={() => setSelectedPkg(p.id)} style={{ ...S.btn, padding: '6px 12px', fontSize: 12, background: selectedPkg === p.id ? p.color + '30' : 'rgba(255,255,255,0.05)', color: selectedPkg === p.id ? p.color : 'rgba(255,255,255,0.4)', border: `1px solid ${selectedPkg === p.id ? p.color + '50' : 'rgba(255,255,255,0.06)'}` }}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleActivate}
            disabled={!search.trim() || activating}
            style={{ ...S.btn, background: search.trim() ? 'linear-gradient(135deg, #a78bfa, #60a5fa)' : 'rgba(255,255,255,0.05)', color: search.trim() ? '#fff' : 'rgba(255,255,255,0.3)', width: '100%', cursor: search.trim() ? 'pointer' : 'not-allowed' }}
          >
            {activating ? 'Activating...' : 'Activate Package'}
          </button>
        </div>

        {/* Promo Toggle & Recent */}
        <div style={S.card}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#fff' }}>Promotions</div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Starter Promo (50% OFF)</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>$5 → $2.50 for 7 days</div>
            </div>
            <div
              onClick={togglePromo}
              style={{
                width: 48, height: 26, borderRadius: 13, cursor: 'pointer',
                background: promoActive ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)',
                border: `2px solid ${promoActive ? '#22c55e' : 'rgba(255,255,255,0.15)'}`,
                position: 'relative', transition: 'all 0.3s',
              }}
            >
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: promoActive ? '#22c55e' : 'rgba(255,255,255,0.4)', position: 'absolute', top: 1, left: promoActive ? 24 : 1, transition: 'all 0.3s' }} />
            </div>
          </div>

          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Recent Activations</div>
          {loading ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center' as const, padding: 20 }}>Loading...</div>
          ) : (
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {(stats?.users || [])
                .filter((u: Record<string, unknown>) => u.active_package && u.active_package !== 'none')
                .sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(b.package_purchased_at || 0) - Number(a.package_purchased_at || 0))
                .slice(0, 10)
                .map((u: Record<string, unknown>) => {
                  const pkg = PACKAGES.find(p => p.id === u.active_package);
                  return (
                    <div key={String(u.uid)} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{String(u.name || 'Unknown')}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{String(u.email || '').slice(0, 25)}</div>
                      </div>
                      <div style={{ padding: '3px 10px', borderRadius: 6, background: (pkg?.color || '#666') + '20', color: pkg?.color || '#666', fontSize: 11, fontWeight: 600 }}>
                        {pkg?.name || String(u.active_package)}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
