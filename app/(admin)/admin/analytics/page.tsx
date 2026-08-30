'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { detectApiUrl } from '@/lib/utils';

const INTER = "'Inter', sans-serif";
const SG = "'Space Grotesk', sans-serif";

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalBalance: number;
  totalClaimed: number;
  totalPackageSpend: number;
  withPackage: number;
  topDirects: { uid: string; name: string; email: string; referral_code: string; direct_count: number; team_volume: number }[];
  topTeam: { uid: string; name: string; email: string; referral_code: string; direct_count: number; team_volume: number }[];
  recentClaims: { user_id: string; name: string; amount: number; created_at: number }[];
  claims24h: number;
  claims24hVolume: number;
  p2pCount: number;
  p2pVolume: number;
  withdrawals: number;
  withdrawalVolume: number;
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
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const Card = ({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) => (
  <div style={{
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 14, padding: '16px 14px',
  }}>
    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{label}</div>
    <div style={{ fontFamily: SG, fontSize: 22, fontWeight: 800, color }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{sub}</div>}
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.3)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 16, height: 2, background: '#a78bfa', borderRadius: 2 }} />
      {title}
    </div>
    {children}
  </div>
);

export default function AnalyticsPage() {
  const apiUrl = detectApiUrl();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/analytics`);
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
  }, [apiUrl]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const i = setInterval(load, 30000); return () => clearInterval(i); }, [load]);

  if (loading || !data) return <AdminLayout title="Analytics"><div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>Loading analytics...</div></AdminLayout>;

  const activeRate = data.totalUsers > 0 ? ((data.activeUsers / data.totalUsers) * 100).toFixed(1) : '0';
  const avgClaim = data.claims24h > 0 ? (data.claims24hVolume / data.claims24h).toFixed(4) : '0';

  return (
    <AdminLayout title="Analytics">
      <div style={{ fontFamily: INTER }}>
        {/* Overview */}
        <Section title="Overview">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <Card label="Total Users" value={data.totalUsers} color="#a78bfa" />
            <Card label="Active (24h)" value={data.activeUsers} color="#22c55e" sub={`${activeRate}% active rate`} />
            <Card label="Inactive" value={data.inactiveUsers} color="#ef4444" />
            <Card label="With Package" value={data.withPackage} color="#60a5fa" />
          </div>
        </Section>

        {/* Financial */}
        <Section title="Financial">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <Card label="Total Balance" value={`ONC ${data.totalBalance.toFixed(2)}`} color="#fbbf24" />
            <Card label="Total Claimed" value={`ONC ${data.totalClaimed.toFixed(2)}`} color="#22c55e" />
            <Card label="Package Revenue" value={`ONC ${data.totalPackageSpend.toFixed(2)}`} color="#a78bfa" />
            <Card label="Withdrawals" value={data.withdrawals} color="#ef4444" sub={`ONC ${data.withdrawalVolume.toFixed(2)} volume`} />
          </div>
        </Section>

        {/* Claims Activity */}
        <Section title="Claims Activity (24h)">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <Card label="Claims (24h)" value={data.claims24h} color="#22c55e" />
            <Card label="Volume (24h)" value={`ONC ${data.claims24hVolume.toFixed(4)}`} color="#60a5fa" />
            <Card label="Avg per Claim" value={`ONC ${avgClaim}`} color="#fbbf24" />
          </div>
        </Section>

        {/* P2P */}
        <Section title="P2P Transfers">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <Card label="Total Transfers" value={data.p2pCount} color="#a78bfa" />
            <Card label="Total Volume" value={`ONC ${data.p2pVolume.toFixed(2)}`} color="#60a5fa" />
          </div>
        </Section>

        {/* Top 10 Direct Referrals */}
        <Section title="Top 10 Direct Referrals">
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1.5fr 1fr 1fr', padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)' }}>
              <div>#</div><div>Name</div><div>Email</div><div>Directs</div><div>Team Biz</div>
            </div>
            {data.topDirects.map((u, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1.5fr 1fr 1fr', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12, color: 'rgba(255,255,255,0.7)', alignItems: 'center', background: i < 3 ? 'rgba(251,191,36,0.03)' : 'transparent' }}>
                <div style={{ fontFamily: SG, fontWeight: 800, color: i < 3 ? '#fbbf24' : 'rgba(255,255,255,0.3)' }}>{i + 1}</div>
                <div style={{ fontWeight: 600 }}>{u.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{u.email}</div>
                <div style={{ fontFamily: SG, fontWeight: 700, color: '#60a5fa' }}>{u.direct_count}</div>
                <div style={{ fontFamily: SG, fontWeight: 700, color: '#22c55e' }}>{u.team_volume.toFixed(2)} ONC</div>
              </div>
            ))}
            {data.topDirects.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>No data</div>}
          </div>
        </Section>

        {/* Top 10 Team Volume */}
        <Section title="Top 10 Team Volume">
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1.5fr 1fr 1fr', padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)' }}>
              <div>#</div><div>Name</div><div>Email</div><div>Directs</div><div>Team Biz</div>
            </div>
            {data.topTeam.map((u, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1.5fr 1fr 1fr', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12, color: 'rgba(255,255,255,0.7)', alignItems: 'center', background: i < 3 ? 'rgba(167,139,250,0.03)' : 'transparent' }}>
                <div style={{ fontFamily: SG, fontWeight: 800, color: i < 3 ? '#a78bfa' : 'rgba(255,255,255,0.3)' }}>{i + 1}</div>
                <div style={{ fontWeight: 600 }}>{u.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{u.email}</div>
                <div style={{ fontFamily: SG, fontWeight: 700, color: '#60a5fa' }}>{u.direct_count}</div>
                <div style={{ fontFamily: SG, fontWeight: 700, color: '#22c55e' }}>{u.team_volume.toFixed(2)} ONC</div>
              </div>
            ))}
            {data.topTeam.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>No data</div>}
          </div>
        </Section>

        {/* Top 10 Latest Claims */}
        <Section title="Top 10 Latest Claims">
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1fr 1.5fr', padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)' }}>
              <div>#</div><div>User</div><div>Amount</div><div>Date & Time</div>
            </div>
            {data.recentClaims.map((c, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1fr 1.5fr', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12, color: 'rgba(255,255,255,0.7)', alignItems: 'center' }}>
                <div style={{ fontFamily: SG, fontWeight: 800, color: 'rgba(255,255,255,0.3)' }}>{i + 1}</div>
                <div style={{ fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontFamily: SG, fontWeight: 700, color: '#22c55e' }}>{c.amount.toFixed(4)} ONC</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{fmtDate(c.created_at)} ({timeAgo(c.created_at)})</div>
              </div>
            ))}
            {data.recentClaims.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>No claims yet</div>}
          </div>
        </Section>
      </div>
    </AdminLayout>
  );
}
