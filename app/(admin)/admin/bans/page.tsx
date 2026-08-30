'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { detectApiUrl } from '@/lib/utils';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

interface BannedUser {
  uid: string;
  name: string;
  email: string;
  ban_reason: string;
  banned_at: number;
  referral_code: string;
}

interface Appeal {
  id: string;
  uid: string;
  user_name: string;
  user_email: string;
  ban_reason: string;
  appeal_reason: string;
  status: string;
  created_at: number;
  reviewed_at?: number;
}

interface UserResult {
  uid: string;
  name: string;
  email: string;
  banned: boolean;
}

function getAdminUid() {
  if (typeof window === 'undefined') return null;
  return document.cookie.match(/onc_uid=([^;]+)/)?.[1] || null;
}

export default function BansPage() {
  const apiUrl = detectApiUrl();
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'appeals' | 'banned' | 'search'>('search');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showBanModal, setShowBanModal] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);

  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [allUsers, setAllUsers] = useState<UserResult[]>([]);

  const showToast = (msg: string, err = false) => { setToast({ msg, err }); setTimeout(() => setToast(null), 3000); };

  const loadData = useCallback(async () => {
    try {
      const uid = getAdminUid();
      if (!uid) return;
      const [bansRes, usersRes] = await Promise.all([
        fetch(`${apiUrl}/api/admin/bans`, { headers: { 'x-auth-uid': uid } }),
        fetch(`${apiUrl}/api/admin/users`, { headers: { 'x-auth-uid': uid } }),
      ]);
      if (bansRes.ok) {
        const data = await bansRes.json();
        setBannedUsers(data.bannedUsers || []);
        setAppeals(data.appeals || []);
      }
      if (usersRes.ok) {
        const users = await usersRes.json();
        if (Array.isArray(users)) {
          setAllUsers(users.map((u: Record<string, unknown>) => ({
            uid: String(u.uid || u.id || ''),
            name: String(u.name || ''),
            email: String(u.email || ''),
            banned: Boolean(u.banned),
          })));
        }
      }
    } catch { } finally { setLoading(false); }
  }, [apiUrl]);

  useEffect(() => { loadData(); }, [loadData]);

  const searchUsers = (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    const q = query.toLowerCase();
    const results = allUsers.filter(u =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.uid.toLowerCase().includes(q)
    ).slice(0, 20);
    setSearchResults(results);
  };

  const handleBan = async (uid: string) => {
    setActionLoading(uid);
    try {
      const adminUid = getAdminUid();
      const res = await fetch(`${apiUrl}/api/admin/bans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': adminUid || '' },
        body: JSON.stringify({ uid, action: 'ban', reason: banReason || 'No reason provided' }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('User banned!');
        setShowBanModal(null);
        setBanReason('');
        loadData();
      } else {
        showToast(data.error || 'Failed to ban user', true);
      }
    } catch (e) { showToast('Error: ' + String(e), true); }
    finally { setActionLoading(null); }
  };

  const handleUnban = async (uid: string) => {
    setActionLoading(uid);
    try {
      const adminUid = getAdminUid();
      const res = await fetch(`${apiUrl}/api/admin/bans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': adminUid || '' },
        body: JSON.stringify({ uid, action: 'unban' }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('User unbanned!');
        loadData();
      } else {
        showToast(data.error || 'Failed to unban user', true);
      }
    } catch (e) { showToast('Error: ' + String(e), true); }
    finally { setActionLoading(null); }
  };

  const handleApproveAppeal = async (appealId: string) => {
    setActionLoading(appealId);
    try {
      const adminUid = getAdminUid();
      const res = await fetch(`${apiUrl}/api/admin/bans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': adminUid || '' },
        body: JSON.stringify({ appealId, action: 'approve_appeal' }),
      });
      const data = await res.json();
      if (res.ok) { showToast('Appeal approved!'); loadData(); }
      else { showToast(data.error || 'Failed', true); }
    } catch (e) { showToast('Error: ' + String(e), true); }
    finally { setActionLoading(null); }
  };

  const handleRejectAppeal = async (appealId: string) => {
    setActionLoading(appealId);
    try {
      const adminUid = getAdminUid();
      const res = await fetch(`${apiUrl}/api/admin/bans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': adminUid || '' },
        body: JSON.stringify({ appealId, action: 'reject_appeal' }),
      });
      const data = await res.json();
      if (res.ok) { showToast('Appeal rejected'); loadData(); }
      else { showToast(data.error || 'Failed', true); }
    } catch (e) { showToast('Error: ' + String(e), true); }
    finally { setActionLoading(null); }
  };

  const filteredBanned = bannedUsers.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAppeals = appeals.filter(a =>
    !search || a.user_name?.toLowerCase().includes(search.toLowerCase()) || a.user_email?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingAppeals = filteredAppeals.filter(a => a.status === 'pending');
  const reviewedAppeals = filteredAppeals.filter(a => a.status !== 'pending');

  const formatDate = (ts: number) => {
    if (!ts) return '-';
    const d = new Date(ts);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const TABS = [
    { key: 'search' as const, label: 'Ban User', icon: 'ban' },
    { key: 'banned' as const, label: `Banned (${filteredBanned.length})`, icon: 'list' },
    { key: 'appeals' as const, label: `Appeals (${pendingAppeals.length})`, icon: 'appeal' },
  ];

  return (
    <AdminLayout title="Ban Management">
      <div style={{ padding: '0 0 40px', fontFamily: INTER }}>
        {toast && (
          <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '14px 24px', borderRadius: 12, background: toast.err ? 'rgba(239,68,68,0.9)' : 'rgba(34,197,94,0.9)', color: '#fff', fontSize: 14, fontWeight: 600, backdropFilter: 'blur(12px)' }}>
            {toast.msg}
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: SG, fontSize: 22, fontWeight: 800, color: 'white' }}>Ban Management</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Search users, ban/unban, review appeals</div>
        </div>

        <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4, marginBottom: 20 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: '10px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              background: tab === t.key ? 'rgba(167,139,250,0.15)' : 'transparent',
              color: tab === t.key ? '#a78bfa' : 'rgba(255,255,255,0.4)',
              border: tab === t.key ? '1px solid rgba(167,139,250,0.3)' : '1px solid transparent',
            }}>{t.label}</button>
          ))}
        </div>

        {tab === 'search' && (
          <div style={{ marginBottom: 16, position: 'relative' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e => { setSearch(e.target.value); searchUsers(e.target.value); }}
              placeholder="Search by name, email, or UID..."
              style={{ width: '100%', padding: '12px 14px 12px 38px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 13, outline: 'none', fontFamily: INTER, boxSizing: 'border-box' }} />
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.05)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Loading...</div>
          </div>
        ) : tab === 'search' ? (
          <div>
            {searchResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 50, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
                {!search.trim() ? 'Type to search for users' : 'No users found'}
              </div>
            ) : (
              searchResults.map(u => (
                <div key={u.uid} style={{ background: u.banned ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${u.banned ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>{u.name || 'Unknown'}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{u.email}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 2, wordBreak: 'break-all' }}>{u.uid}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, padding: '3px 10px', borderRadius: 8, background: u.banned ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: u.banned ? '#ef4444' : '#22c55e', border: `1px solid ${u.banned ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}` }}>
                      {u.banned ? 'BANNED' : 'ACTIVE'}
                    </span>
                    {u.banned ? (
                      <button disabled={actionLoading === u.uid} onClick={() => handleUnban(u.uid)} style={{
                        padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontSize: 11, fontWeight: 700, cursor: actionLoading === u.uid ? 'not-allowed' : 'pointer',
                      }}>{actionLoading === u.uid ? '...' : 'Unban'}</button>
                    ) : (
                      <button disabled={actionLoading === u.uid} onClick={() => setShowBanModal(u.uid)} style={{
                        padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      }}>Ban</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : tab === 'banned' ? (
          <div>
            {filteredBanned.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 50, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>No banned users</div>
            ) : (
              filteredBanned.map(u => (
                <div key={u.uid} style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 16, padding: '18px 20px', marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: SG, fontWeight: 700, fontSize: 14, color: 'white' }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{u.email}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>Reason: <span style={{ color: 'rgba(239,68,68,0.7)' }}>{u.ban_reason}</span></div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>Banned: {formatDate(u.banned_at)}</div>
                    </div>
                    <button disabled={actionLoading === u.uid} onClick={() => handleUnban(u.uid)} style={{
                      padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontSize: 12, fontWeight: 700, cursor: actionLoading === u.uid ? 'not-allowed' : 'pointer',
                    }}>{actionLoading === u.uid ? '...' : 'Unban User'}</button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            {pendingAppeals.length === 0 && reviewedAppeals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 50, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>No appeals found</div>
            ) : (
              <>
                {pendingAppeals.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Pending ({pendingAppeals.length})</div>
                    {pendingAppeals.map(a => (
                      <div key={a.id} style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 16, padding: 20, marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                          <div>
                            <div style={{ fontFamily: SG, fontWeight: 700, fontSize: 14, color: 'white' }}>{a.user_name}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{a.user_email}</div>
                          </div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{formatDate(a.created_at)}</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(239,68,68,0.7)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Ban Reason</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{a.ban_reason}</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(167,139,250,0.7)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Appeal Reason</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{a.appeal_reason || 'No reason provided'}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button disabled={actionLoading === a.id} onClick={() => handleApproveAppeal(a.id)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontSize: 12, fontWeight: 700, cursor: actionLoading === a.id ? 'not-allowed' : 'pointer' }}>
                            {actionLoading === a.id ? '...' : 'Approve & Unban'}
                          </button>
                          <button disabled={actionLoading === a.id} onClick={() => handleRejectAppeal(a.id)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: actionLoading === a.id ? 'not-allowed' : 'pointer' }}>
                            {actionLoading === a.id ? '...' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {reviewedAppeals.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Reviewed ({reviewedAppeals.length})</div>
                    {reviewedAppeals.map(a => (
                      <div key={a.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '16px 18px', marginBottom: 10, opacity: 0.7 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.status === 'approved' ? '#22c55e' : '#ef4444' }} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{a.user_name}</div>
                              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{a.user_email}</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' as const }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5, color: a.status === 'approved' ? '#22c55e' : '#ef4444', background: a.status === 'approved' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', padding: '3px 8px', borderRadius: 6 }}>{a.status}</div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>{formatDate(a.reviewed_at || 0)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {showBanModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={() => { setShowBanModal(null); setBanReason(''); }}>
            <div style={{ width: '100%', maxWidth: 400, background: '#0d0e1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28 }} onClick={e => e.stopPropagation()}>
              <div style={{ fontFamily: SG, fontSize: 18, fontWeight: 800, color: '#ef4444', marginBottom: 4 }}>Ban User</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>This will immediately block the user from accessing the platform.</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Reason for ban:</div>
              <textarea value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Enter reason..."
                style={{ width: '100%', minHeight: 80, padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: INTER, boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button onClick={() => { setShowBanModal(null); setBanReason(''); }} style={{ flex: 1, padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: INTER }}>Cancel</button>
                <button disabled={!banReason.trim() || actionLoading === showBanModal} onClick={() => handleBan(showBanModal)} style={{
                  flex: 1, padding: 12, borderRadius: 12, border: 'none',
                  background: banReason.trim() ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                  color: banReason.trim() ? '#ef4444' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 700, cursor: banReason.trim() ? 'pointer' : 'not-allowed', fontFamily: INTER,
                }}>{actionLoading === showBanModal ? 'Banning...' : 'Ban User'}</button>
              </div>
            </div>
          </div>
        )}

        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </AdminLayout>
  );
}
