'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { detectApiUrl } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/components/ui/Toast';

interface Leader {
  uid: string;
  name: string;
  email: string;
  package: string;
  balance: number;
  teamSize: number;
  leaderStatus: string;
  verified: boolean;
  rank: number;
  notes?: string;
  createdAt?: number;
}

type StatusOption = 'active' | 'under_review' | 'restricted' | 'suspended';

const STATUS_OPTIONS: StatusOption[] = ['active', 'under_review', 'restricted', 'suspended'];

const STATUS_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  active: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
  under_review: { color: '#eab308', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.2)' },
  restricted: { color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)' },
  suspended: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
};

const TABLE_HEADER_STYLE = {
  padding: '12px 14px',
  textAlign: 'left' as const,
  fontWeight: 600,
  fontSize: 10,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
  color: 'rgba(255,255,255,0.35)',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  whiteSpace: 'nowrap' as const,
};

const TABLE_CELL_STYLE = {
  padding: '12px 14px',
  fontSize: 12,
  borderBottom: '1px solid rgba(255,255,255,0.03)',
};

export default function AdminLeadersPage() {
  const { uid, loading: authLoading } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [notesModal, setNotesModal] = useState<{ open: boolean; leader: Leader | null; text: string }>({
    open: false,
    leader: null,
    text: '',
  });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; leader: Leader | null }>({
    open: false,
    leader: null,
  });
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState<string | null>(null);

  const loadLeaders = useCallback(async () => {
    if (!uid) return;
    try {
      setLoading(true);
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/leaders`, {
        headers: { 'x-auth-uid': uid },
      });
      if (!res.ok) {
        showToast('Failed to load leaders', 'error');
        setLoading(false);
        return;
      }
      const data = await res.json();
      const list: Leader[] = Array.isArray(data) ? data.map((l: Record<string, unknown>, i: number) => ({
        uid: String(l.uid || l.id || ''),
        name: String(l.name || ''),
        email: String(l.email || ''),
        package: String(l.package || l.plan || ''),
        balance: Number(l.balance || 0),
        teamSize: Number(l.teamSize || l.team_size || 0),
        leaderStatus: String(l.leaderStatus || l.leader_status || 'active'),
        verified: Boolean(l.verified),
        rank: Number(l.rank || i + 1),
        notes: String(l.notes || ''),
        createdAt: Number(l.createdAt || 0),
      })) : [];
      setLeaders(list);
    } catch {
      showToast('Failed to load leaders', 'error');
    } finally {
      setLoading(false);
    }
  }, [uid, showToast]);

  useEffect(() => {
    if (authLoading || !uid) return;
    loadLeaders();
  }, [uid, authLoading, loadLeaders]);

  const filtered = leaders.filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (l.name && l.name.toLowerCase().includes(q)) ||
      (l.email && l.email.toLowerCase().includes(q))
    );
  });

  const statTotal = leaders.length;
  const statActive = leaders.filter((l) => l.leaderStatus === 'active').length;
  const statUnderReview = leaders.filter((l) => l.leaderStatus === 'under_review').length;
  const statSuspended = leaders.filter((l) => l.leaderStatus === 'suspended').length;
  const statVerified = leaders.filter((l) => l.verified).length;

  async function setStatus(leader: Leader, status: StatusOption) {
    setStatusLoading(leader.uid);
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/leader/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({ uid: leader.uid, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showToast(`Status updated to ${status}`);
      loadLeaders();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    } finally {
      setStatusLoading(null);
    }
  }

  async function toggleVerified(leader: Leader) {
    setVerifyLoading(leader.uid);
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/leader/verify-toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({ uid: leader.uid, verified: !leader.verified }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showToast(`Leader ${leader.verified ? 'unverified' : 'verified'}`);
      loadLeaders();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    } finally {
      setVerifyLoading(null);
    }
  }

  async function saveNotes() {
    if (!notesModal.leader) return;
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/leader/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({ uid: notesModal.leader.uid, notes: notesModal.text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showToast('Notes saved');
      setNotesModal({ open: false, leader: null, text: '' });
      loadLeaders();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    }
  }

  async function deleteUser() {
    if (!deleteModal.leader) return;
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/leader/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({ uid: deleteModal.leader.uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showToast('User deleted');
      setDeleteModal({ open: false, leader: null });
      loadLeaders();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    }
  }

  if (authLoading || loading) {
    return (
      <AdminLayout title="Leader Management">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 32,
              height: 32,
              border: '3px solid rgba(167,139,250,0.1)',
              borderTop: '3px solid #a78bfa',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px',
            }} />
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase' as const, fontWeight: 700 }}>
              Loading leaders...
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Leader Management">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Total Leaders', value: statTotal, color: '#a78bfa' },
            { label: 'Active', value: statActive, color: '#22c55e' },
            { label: 'Under Review', value: statUnderReview, color: '#eab308' },
            { label: 'Suspended', value: statSuspended, color: '#ef4444' },
            { label: 'Verified', value: statVerified, color: '#60a5fa' },
          ].map((s) => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14,
              padding: 16,
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: 10,
                textTransform: 'uppercase' as const,
                letterSpacing: 0.5,
                color: 'rgba(255,255,255,0.35)',
                marginBottom: 4,
              }}>
                {s.label}
              </div>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 800,
                fontSize: 22,
                color: s.color,
              }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Search + Refresh */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 40px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                color: 'white',
                fontSize: 13,
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
              }}
            />
          </div>
          <button
            onClick={loadLeaders}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 12,
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Table */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={TABLE_HEADER_STYLE}>Rank</th>
                  <th style={TABLE_HEADER_STYLE}>Name</th>
                  <th style={TABLE_HEADER_STYLE}>Email</th>
                  <th style={TABLE_HEADER_STYLE}>Package</th>
                  <th style={TABLE_HEADER_STYLE}>Balance</th>
                  <th style={TABLE_HEADER_STYLE}>Team Size</th>
                  <th style={TABLE_HEADER_STYLE}>Leader Status</th>
                  <th style={TABLE_HEADER_STYLE}>Verified</th>
                  <th style={TABLE_HEADER_STYLE}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                      No leaders found
                    </td>
                  </tr>
                ) : (
                  filtered.map((leader) => {
                    const sc = STATUS_COLORS[leader.leaderStatus] || STATUS_COLORS.active;
                    return (
                      <tr key={leader.uid} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        {/* Rank */}
                        <td style={TABLE_CELL_STYLE}>
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: 'rgba(167,139,250,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontWeight: 800,
                            fontSize: 12,
                            color: '#a78bfa',
                          }}>
                            {leader.rank}
                          </div>
                        </td>

                        {/* Name */}
                        <td style={TABLE_CELL_STYLE}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(96,165,250,0.15))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontFamily: "'Space Grotesk', sans-serif",
                              fontWeight: 800,
                              fontSize: 14,
                              color: '#a78bfa',
                              flexShrink: 0,
                            }}>
                              {(leader.name || '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                                {leader.name || 'Unknown'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td style={{ ...TABLE_CELL_STYLE, fontSize: 11, color: 'rgba(255,255,255,0.5)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                          {leader.email}
                        </td>

                        {/* Package */}
                        <td style={TABLE_CELL_STYLE}>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: 100,
                            fontSize: 10,
                            fontWeight: 800,
                            textTransform: 'uppercase' as const,
                            letterSpacing: 0.5,
                            background: 'rgba(167,139,250,0.1)',
                            color: '#a78bfa',
                            border: '1px solid rgba(167,139,250,0.15)',
                          }}>
                            {leader.package || '-'}
                          </span>
                        </td>

                        {/* Balance */}
                        <td style={{ ...TABLE_CELL_STYLE, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, color: '#22c55e' }}>
                          {leader.balance.toFixed(4)}
                        </td>

                        {/* Team Size */}
                        <td style={{ ...TABLE_CELL_STYLE, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13 }}>
                          {leader.teamSize}
                        </td>

                        {/* Leader Status */}
                        <td style={TABLE_CELL_STYLE}>
                          <select
                            value={leader.leaderStatus}
                            onChange={(e) => setStatus(leader, e.target.value as StatusOption)}
                            disabled={statusLoading === leader.uid}
                            style={{
                              padding: '5px 8px',
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 700,
                              border: `1px solid ${sc.border}`,
                              background: sc.bg,
                              color: sc.color,
                              cursor: statusLoading === leader.uid ? 'not-allowed' : 'pointer',
                              outline: 'none',
                              fontFamily: "'Inter', sans-serif",
                              minWidth: 110,
                            }}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s} style={{ background: '#0d0d23', color: '#fff' }}>
                                {s.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Verified */}
                        <td style={TABLE_CELL_STYLE}>
                          <button
                            onClick={() => toggleVerified(leader)}
                            disabled={verifyLoading === leader.uid}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '5px 12px',
                              borderRadius: 8,
                              border: 'none',
                              cursor: verifyLoading === leader.uid ? 'not-allowed' : 'pointer',
                              background: leader.verified ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
                              color: leader.verified ? '#22c55e' : 'rgba(255,255,255,0.4)',
                              fontWeight: 700,
                              fontSize: 11,
                              fontFamily: "'Inter', sans-serif",
                              transition: '0.15s',
                            }}
                          >
                            {leader.verified ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="8" y1="12" x2="16" y2="12" />
                              </svg>
                            )}
                            {leader.verified ? 'Yes' : 'No'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td style={{ ...TABLE_CELL_STYLE, whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap' }}>
                            {/* Notes */}
                            <button
                              onClick={() => setNotesModal({ open: true, leader, text: leader.notes || '' })}
                              title="Add Notes"
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 8,
                                border: '1px solid rgba(167,139,250,0.15)',
                                background: 'rgba(167,139,250,0.08)',
                                color: '#a78bfa',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: '0.15s',
                              }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(167,139,250,0.15)'; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(167,139,250,0.08)'; }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                              </svg>
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setDeleteModal({ open: true, leader })}
                              title="Delete User"
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 8,
                                border: '1px solid rgba(239,68,68,0.15)',
                                background: 'rgba(239,68,68,0.08)',
                                color: '#ef4444',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: '0.15s',
                              }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.15)'; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'; }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Notes Modal */}
      {notesModal.open && notesModal.leader && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setNotesModal({ open: false, leader: null, text: '' }); }}
        >
          <div style={{
            background: '#0d0d23',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
            padding: 28,
            maxWidth: 440,
            width: '100%',
          }}>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 18, marginBottom: 6 }}>
              Notes for {notesModal.leader.name || 'Leader'}
            </h3>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>
              Add admin notes for this leader. Only admins can see these.
            </p>
            <textarea
              value={notesModal.text}
              onChange={(e) => setNotesModal({ ...notesModal, text: e.target.value })}
              placeholder="Enter notes..."
              rows={5}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                color: 'white',
                fontSize: 13,
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.5,
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                onClick={() => setNotesModal({ open: false, leader: null, text: '' })}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.7)',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveNotes}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  border: 'none',
                  background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                  color: '#000',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && deleteModal.leader && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteModal({ open: false, leader: null }); }}
        >
          <div style={{
            background: '#0d0d23',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 20,
            padding: 28,
            maxWidth: 400,
            width: '100%',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(239,68,68,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 18, color: '#ef4444' }}>
                Delete User
              </h3>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: 20 }}>
              Are you sure you want to permanently delete <strong style={{ color: '#fff' }}>{deleteModal.leader.name || 'this user'}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setDeleteModal({ open: false, leader: null })}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.7)',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                onClick={deleteUser}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  border: 'none',
                  background: '#ef4444',
                  color: '#fff',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {ToastComponent}
    </AdminLayout>
  );
}
