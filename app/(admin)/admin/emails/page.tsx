'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { detectApiUrl } from '@/lib/utils';

const INTER = "'Inter', sans-serif";
const SG = "'Space Grotesk', sans-serif";

interface EmailEntry {
  email: string;
  name: string;
  uid: string;
  created_at: number;
  last_claim: number;
  balance: number;
  package_status: string;
}

function timeAgo(ts: number): string {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function EmailsPage() {
  const apiUrl = detectApiUrl();
  const [emails, setEmails] = useState<EmailEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const loadEmails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/emails?filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails);
        setTotal(data.total);
      }
    } catch {}
    setLoading(false);
  }, [apiUrl, filter]);

  useEffect(() => { loadEmails(); }, [loadEmails]);

  const filtered = emails.filter(e => {
    if (search && !e.email.toLowerCase().includes(search.toLowerCase()) && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function copyAllEmails() {
    const text = filtered.map(e => e.email).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadCSV() {
    const header = 'Email,Name,UID,Created,Last Claim,Balance,Package\n';
    const rows = filtered.map(e =>
      `${e.email},${e.name},${e.uid},${new Date(e.created_at).toISOString()},${e.last_claim ? new Date(e.last_claim).toISOString() : ''},${e.balance},${e.package_status}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emails_${filter}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminLayout title="Email Extractor">
      <div style={{ fontFamily: INTER }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 14px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Total Emails</div>
            <div style={{ fontFamily: SG, fontSize: 22, fontWeight: 800, color: '#a78bfa' }}>{total}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 14px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Filtered</div>
            <div style={{ fontFamily: SG, fontSize: 22, fontWeight: 800, color: '#60a5fa' }}>{filtered.length}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 14px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>With Package</div>
            <div style={{ fontFamily: SG, fontSize: 22, fontWeight: 800, color: '#22c55e' }}>{filtered.filter(e => e.package_status === 'active').length}</div>
          </div>
        </div>

        {/* Filters + Actions */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { key: 'all', label: 'All Users' },
            { key: 'active', label: 'Active (24h)' },
            { key: 'inactive', label: 'Inactive' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '8px 16px', borderRadius: 10, border: '1px solid',
              borderColor: filter === f.key ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.08)',
              background: filter === f.key ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.03)',
              color: filter === f.key ? '#a78bfa' : 'rgba(255,255,255,0.5)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: INTER,
            }}>
              {f.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button onClick={copyAllEmails} style={{
            padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(34,197,94,0.2)',
            background: 'rgba(34,197,94,0.08)', color: '#22c55e',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: INTER,
          }}>
            {copied ? 'Copied!' : 'Copy All'}
          </button>
          <button onClick={downloadCSV} style={{
            padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(96,165,250,0.2)',
            background: 'rgba(96,165,250,0.08)', color: '#60a5fa',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: INTER,
          }}>
            Download CSV
          </button>
        </div>

        <input
          type="text"
          placeholder="Search email or name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white',
            fontSize: 13, fontFamily: INTER, outline: 'none', marginBottom: 16, boxSizing: 'border-box',
          }}
        />

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>No emails found</div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr',
              padding: '12px 16px', background: 'rgba(255,255,255,0.03)',
              borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 9,
              fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' as const,
              color: 'rgba(255,255,255,0.35)',
            }}>
              <div>Email</div>
              <div>Name</div>
              <div>Balance</div>
              <div>Package</div>
              <div>Joined</div>
              <div>Last Active</div>
            </div>
            {filtered.slice(0, 200).map((e, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr',
                padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                fontSize: 12, color: 'rgba(255,255,255,0.7)', alignItems: 'center',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
              }}>
                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{e.email}</div>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{e.name}</div>
                <div style={{ fontFamily: SG, fontWeight: 700, color: '#22c55e' }}>{e.balance.toFixed(2)}</div>
                <div>
                  <span style={{
                    padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                    background: e.package_status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
                    color: e.package_status === 'active' ? '#22c55e' : 'rgba(255,255,255,0.3)',
                  }}>
                    {e.package_status === 'active' ? 'Active' : 'None'}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{timeAgo(e.created_at)}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{e.last_claim ? timeAgo(e.last_claim) : 'Never'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
