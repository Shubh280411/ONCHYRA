'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { detectApiUrl } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';

interface NotiUser { id: string; name: string; email: string; balance: number; }
interface NotiHistory { id: string; type: string; title: string; message: string; userId: string; link?: string; linkTitle?: string; createdAt?: number; }

export default function AdminNotificationsPage() {
  const { uid, loading: authLoading } = useAuth();
  const [activePage, setActivePage] = useState<'send' | 'history' | 'users'>('send');
  const [notiType, setNotiType] = useState('update');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [linkOn, setLinkOn] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<NotiUser[]>([]);
  const [allUsers, setAllUsers] = useState<NotiUser[]>([]);
  const [history, setHistory] = useState<NotiHistory[]>([]);
  const [statTotal, setStatTotal] = useState(0);
  const [statUsers, setStatUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);

  useEffect(() => {
    if (authLoading || !uid) return;
    loadData();
  }, [uid, authLoading]);

  async function loadData() {
    try {
      const apiUrl = detectApiUrl();
      await Promise.all([loadStats(), loadHistory()]);
    } catch { /* ignore */ }
  }

  async function loadStats() {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/users`, { headers: { 'x-auth-uid': uid! } });
      if (res.ok) {
        const data = await res.json();
        const users: NotiUser[] = Array.isArray(data) ? data.map((u: Record<string, unknown>) => ({ id: String(u.id || u.uid || ''), name: String(u.name || 'Unknown'), email: String(u.email || ''), balance: Number(u.balance || 0) })) : [];
        setAllUsers(users); setStatUsers(users.length);
      }
    } catch { /* ignore */ }
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/notifications/count`, { headers: { 'x-auth-uid': uid! } });
      if (res.ok) { const data = await res.json(); setStatTotal(data.count || 0); }
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function loadHistory() {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/notifications/history`, { headers: { 'x-auth-uid': uid! } });
      if (res.ok) { const data = await res.json(); setHistory(Array.isArray(data) ? data : []); }
    } catch { /* ignore */ }
  }

  function showToastMsg(msg: string, error = false) { setToast({ msg, error }); setTimeout(() => setToast(null), 3000); }

  function filterUsers(val: string) {
    setUserSearch(val);
    if (val.length < 2) { setUserSearchResults([]); return; }
    const sk = val.toLowerCase();
    setUserSearchResults(allUsers.filter((u) => u.name.toLowerCase().includes(sk) || u.email.toLowerCase().includes(sk)).slice(0, 20));
  }

  function selectUser(id: string, name: string) { setSelectedUserId(id); setSelectedUserName(name); setUserSearch(''); setUserSearchResults([]); }
  function clearUserSelect() { setSelectedUserId(null); setSelectedUserName(''); }

  function useTemplate(type: string) {
    const templates: Record<string, { type: string; title: string; msg: string; link?: string }> = {
      update: { type: 'update', title: 'Protocol Update', msg: 'A new update has been posted. Check the Updates section.', link: 'updates.html' },
      poll: { type: 'poll', title: 'New Poll is Live!', msg: 'Your vote matters! Cast your vote now.' },
      contest: { type: 'update', title: 'Referral Contest Active!', msg: 'Invite friends and climb the leaderboard to win POL rewards!', link: 'contests.html' },
      warning: { type: 'personal', title: 'Important Notice', msg: 'Please review your account. Action required.' },
    };
    const t = templates[type]; if (!t) return;
    setNotiType(t.type); setTitle(t.title); setMessage(t.msg);
    if (t.link) { setLinkOn(true); setLinkUrl(t.link); setLinkTitle(t.title); }
  }

  async function sendNotification() {
    if (!title.trim() || !message.trim()) { showToastMsg('Title and Message required!', true); return; }
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/notifications/send`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({ userId: selectedUserId || 'all', type: notiType, title: title.trim(), message: message.trim(), link: linkOn ? linkUrl : '', linkTitle: linkOn ? linkTitle : '' }),
      });
      if (!res.ok) throw new Error('Failed');
      showToastMsg('Notification sent!');
      clearForm(); loadStats(); loadHistory();
    } catch (e: unknown) { showToastMsg(e instanceof Error ? e.message : 'Error', true); }
  }

  function clearForm() { setTitle(''); setMessage(''); setLinkOn(false); setLinkTitle(''); setLinkUrl(''); clearUserSelect(); }

  async function deleteNoti(id: string) {
    if (!confirm('Delete this notification?')) return;
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/notifications/delete`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! }, body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error('Failed');
      showToastMsg('Deleted!'); loadHistory(); loadStats();
    } catch (e: unknown) { showToastMsg(e instanceof Error ? e.message : 'Error', true); }
  }

  const SvgSend = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>;
  const SvgHistory = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>;
  const SvgUsersIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
  const SvgBell = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;

  if (loading) return (
    <AdminLayout title="Notifications">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, minHeight: '60vh' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(167,139,250,0.1)', borderTop: '3px solid #a78bfa', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase' as const, fontWeight: 700 }}>Loading Notifications...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </AdminLayout>
  );

  const showPreview = title.trim() || message.trim();
  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'white', outline: 'none', fontFamily: "'Inter', sans-serif", fontSize: 14 };
  const labelStyle: React.CSSProperties = { fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6, marginTop: 12 };

  return (
    <AdminLayout title="Notifications">
      {/* Tab Nav */}
      <div style={{ display: 'flex', gap: 8, padding: 16, background: 'rgba(10,12,25,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, marginBottom: 24 }}>
        {([
          { key: 'send', label: 'Send', icon: <SvgSend /> },
          { key: 'history', label: 'History', icon: <SvgHistory /> },
          { key: 'users', label: 'Users', icon: <SvgUsersIcon /> },
        ] as const).map((p) => (
          <button key={p.key} onClick={() => setActivePage(p.key)} style={{ flex: 1, padding: 12, textAlign: 'center', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', color: activePage === p.key ? 'white' : 'rgba(255,255,255,0.5)', border: 'none', background: activePage === p.key ? 'rgba(255,255,255,0.05)' : 'transparent', borderRight: activePage === p.key ? '3px solid #a78bfa' : 'none', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1000 }}>
        {/* SEND PAGE */}
        {activePage === 'send' && (
          <>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 800, margin: '0 0 25px' }}>Send Notification</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15, marginBottom: 30 }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 20 }}><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' as const, letterSpacing: 1 }}>Total Sent</div><div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 800, marginTop: 5, color: '#a78bfa' }}>{statTotal}</div></div>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 20 }}><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' as const, letterSpacing: 1 }}>Total Users</div><div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 800, marginTop: 5, color: '#22c55e' }}>{statUsers}</div></div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: 20, marginBottom: 20 }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Quick Templates</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 15, flexWrap: 'wrap' }}>
                {[
                  { key: 'update', label: 'Update' },
                  { key: 'poll', label: 'Poll' },
                  { key: 'contest', label: 'Contest' },
                  { key: 'warning', label: 'Warning' },
                ].map((t) => (
                  <button key={t.key} onClick={() => useTemplate(t.key)} style={{ padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', transition: '0.2s' }}>{t.label}</button>
                ))}
              </div>
              <label style={labelStyle}>TARGET</label>
              <div style={{ position: 'relative' }}>
                <input style={inputStyle} value={userSearch} onChange={(e) => filterUsers(e.target.value)} placeholder="Search user by name or email..." />
                {userSearchResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0b0d18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, maxHeight: 200, overflowY: 'auto', zIndex: 100, marginTop: 4 }}>
                    {userSearchResults.map((u) => (
                      <div key={u.id} onClick={() => selectUser(u.id, u.name)} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 13 }}>
                        <div style={{ fontWeight: 600 }}>{u.name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{u.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedUserId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 10, marginTop: 6 }}>
                  <div><div style={{ fontWeight: 600, fontSize: 13 }}>{selectedUserName}</div></div>
                  <button onClick={clearUserSelect} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16 }}>&times;</button>
                </div>
              )}
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{selectedUserId ? 'Selected: ' + selectedUserName : 'All Users'}</div>

              <label style={labelStyle}>TYPE</label>
              <select value={notiType} onChange={(e) => setNotiType(e.target.value)} style={{ ...inputStyle, appearance: 'auto' as const }}>
                <option value="update">Update</option>
                <option value="poll">Poll</option>
                <option value="personal">Personal</option>
              </select>

              <label style={labelStyle}>TITLE</label>
              <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title..." />

              <label style={labelStyle}>MESSAGE</label>
              <textarea style={{ ...inputStyle, minHeight: 100, resize: 'vertical' as const }} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your message..." />

              {/* Link Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                <label style={{ position: 'relative', width: 40, height: 22, flexShrink: 0, cursor: 'pointer' }}>
                  <input type="checkbox" checked={linkOn} onChange={(e) => { setLinkOn(e.target.checked); if (!e.target.checked) { setLinkTitle(''); setLinkUrl(''); } }} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                  <span style={{ position: 'absolute', inset: 0, background: linkOn ? '#a78bfa' : 'rgba(255,255,255,0.1)', borderRadius: 22, cursor: 'pointer', transition: '0.3s' }}>
                    <span style={{ position: 'absolute', width: 16, height: 16, left: linkOn ? 21 : 3, top: 3, background: linkOn ? '#000' : 'rgba(255,255,255,0.4)', borderRadius: '50%', transition: '0.3s' }} />
                  </span>
                </label>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Include Link</span>
              </div>
              {linkOn && (
                <div style={{ marginTop: 10 }}>
                  <label style={labelStyle}>LINK TITLE</label>
                  <input style={inputStyle} value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} placeholder="e.g. View Update" />
                  <label style={labelStyle}>LINK URL</label>
                  <input style={inputStyle} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="e.g. updates.html" />
                </div>
              )}

              {showPreview && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 16, marginTop: 15 }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>PREVIEW</div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{title || '(no title)'}</div>
                  <div style={{ fontSize: 12, opacity: 0.5 }}>{message || '(no message)'}</div>
                  {linkOn && linkUrl && <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 11, color: '#60a5fa', textDecoration: 'underline', marginTop: 6, display: 'block' }}>{linkTitle || linkUrl}</a>}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={sendNotification} style={{ flex: 1, padding: 14, borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#000', fontFamily: "'Inter', sans-serif" }}>Send Now</button>
                <button onClick={clearForm} style={{ flex: 1, padding: 14, borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', sans-serif" }}>Clear</button>
              </div>
            </div>
          </>
        )}

        {/* HISTORY PAGE */}
        {activePage === 'history' && (
          <>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 800, margin: '0 0 25px' }}>History</h2>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: 20, marginBottom: 20, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr>{['Type', 'Title', 'Target', 'Link', 'Time', 'Actions'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '12px 10px', color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1 }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No notifications yet</td></tr>
                    ) : history.map((n) => (
                      <tr key={n.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '12px 10px' }}><span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: n.type === 'update' ? 'rgba(96,165,250,0.15)' : n.type === 'poll' ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)', color: n.type === 'update' ? '#60a5fa' : n.type === 'poll' ? '#22c55e' : '#eab308' }}>{n.type === 'update' ? 'Update' : n.type === 'poll' ? 'Poll' : 'Personal'}</span></td>
                        <td style={{ padding: '12px 10px', fontWeight: 700 }}>{n.title || '-'}</td>
                        <td style={{ padding: '12px 10px' }}><span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: n.userId === 'all' ? 'rgba(34,197,94,0.15)' : 'rgba(167,139,250,0.15)', color: n.userId === 'all' ? '#22c55e' : '#a78bfa' }}>{n.userId === 'all' ? 'All' : 'User'}</span></td>
                        <td style={{ padding: '12px 10px', color: '#60a5fa', fontSize: 12 }}>{n.linkTitle || n.link || <span style={{ opacity: 0.2 }}>-</span>}</td>
                        <td style={{ padding: '12px 10px', fontSize: 11, opacity: 0.4, whiteSpace: 'nowrap' as const }}>{n.createdAt ? new Date(n.createdAt).toLocaleString() : '-'}</td>
                        <td style={{ padding: '12px 10px' }}><button onClick={() => deleteNoti(n.id)} style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* USERS PAGE */}
        {activePage === 'users' && (
          <>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 800, margin: '0 0 25px' }}>Users</h2>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: 20, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr>{['Name', 'Email', 'Balance'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '12px 10px', color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1 }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {allUsers.length === 0 ? (
                      <tr><td colSpan={3} style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No users found</td></tr>
                    ) : allUsers.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '12px 10px', fontWeight: 700 }}>{u.name}</td>
                        <td style={{ padding: '12px 10px', fontSize: 12, opacity: 0.5 }}>{u.email}</td>
                        <td style={{ padding: '12px 10px', fontWeight: 700, color: '#a78bfa' }}>{u.balance.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 30, right: 30, background: toast.error ? '#ef4444' : '#22c55e', color: toast.error ? 'white' : '#000', padding: '14px 24px', borderRadius: 12, fontWeight: 700, zIndex: 3000, fontSize: 13, boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
          {toast.msg}
        </div>
      )}
    </AdminLayout>
  );
}
