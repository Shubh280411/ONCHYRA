'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { detectApiUrl } from '@/lib/utils';

const INTER = "'Inter', sans-serif";
const SG = "'Space Grotesk', sans-serif";

interface OtpEntry {
  email: string;
  otp: string;
  createdAt: number;
  expiresAt: number;
  verified: boolean;
  attempts: number;
  usedAt: null;
  event: string;
  error: string;
  purpose?: string;
}

function timeAgo(ts: number): string {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function formatTime(ts: number): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export default function OTPsPage() {
  const apiUrl = detectApiUrl();
  const [otps, setOtps] = useState<OtpEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadOTPs = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/otp/list`);
      if (res.ok) {
        const data = await res.json();
        setOtps(data);
      }
    } catch {}
    setLoading(false);
  }, [apiUrl]);

  useEffect(() => { loadOTPs(); }, [loadOTPs]);

  useEffect(() => {
    const interval = setInterval(loadOTPs, 10000);
    return () => clearInterval(interval);
  }, [loadOTPs]);

  const filtered = otps.filter(o => {
    if (search && !o.email.toLowerCase().includes(search.toLowerCase()) && !o.otp.includes(search)) return false;
    if (statusFilter === 'verified' && !o.verified) return false;
    if (statusFilter === 'expired' && Date.now() < o.expiresAt) return false;
    if (statusFilter === 'active' && (o.verified || Date.now() > o.expiresAt)) return false;
    return true;
  });

  const total = otps.length;
  const verified = otps.filter(o => o.verified).length;
  const expired = otps.filter(o => Date.now() > o.expiresAt).length;
  const active = total - verified - expired;

  return (
    <AdminLayout title="OTP Manager">
      <div style={{ fontFamily: INTER }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total OTPs', value: total, color: '#a78bfa' },
            { label: 'Active', value: active, color: '#22c55e' },
            { label: 'Verified', value: verified, color: '#60a5fa' },
            { label: 'Expired', value: expired, color: '#ef4444' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14,
              padding: '16px 14px',
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: SG, fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search email or OTP..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 200, padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white',
              fontSize: 13, fontFamily: INTER, outline: 'none',
            }}
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white',
              fontSize: 13, fontFamily: INTER, outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="verified">Verified</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>No OTPs found</div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
              padding: '12px 16px', background: 'rgba(255,255,255,0.03)',
              borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 9,
              fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' as const,
              color: 'rgba(255,255,255,0.35)',
            }}>
              <div>Email</div>
              <div>OTP</div>
              <div>Purpose</div>
              <div>Status</div>
              <div>Sent</div>
              <div>Expires</div>
            </div>

            {/* Rows */}
            {filtered.slice(0, 100).map((o, i) => {
              const isExpired = Date.now() > o.expiresAt;
              const statusColor = o.verified ? '#22c55e' : isExpired ? '#ef4444' : '#fbbf24';
              const statusText = o.verified ? 'Verified' : isExpired ? 'Expired' : 'Active';

              return (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
                  padding: '11px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                  fontSize: 12, color: 'rgba(255,255,255,0.7)', alignItems: 'center',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                }}>
                  <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{o.email}</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#a78bfa', letterSpacing: 2 }}>{o.otp}</div>
                  <div>
                    <span style={{
                      padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                      background: 'rgba(167,139,250,0.1)', color: '#a78bfa',
                    }}>
                      {o.purpose || 'registration'}
                    </span>
                  </div>
                  <div>
                    <span style={{
                      padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                      background: `${statusColor}15`, color: statusColor,
                    }}>
                      {statusText}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{timeAgo(o.createdAt)}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{formatTime(o.expiresAt)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
