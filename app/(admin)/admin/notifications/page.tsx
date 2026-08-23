'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl } from '@/lib/utils';
import Loading from '@/components/ui/Loading';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface NotiUser {
  id: string;
  name: string;
  email: string;
  balance: number;
}

interface NotiHistory {
  id: string;
  type: string;
  title: string;
  message: string;
  userId: string;
  link?: string;
  linkTitle?: string;
  createdAt?: number;
}

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
  const { showToast, ToastComponent } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!uid) { router.push('/admin/login'); return; }
    loadData();
  }, [uid, authLoading]);

  async function loadData() {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/check`, { headers: { 'x-auth-uid': uid! } });
      if (!res.ok) { router.push('/admin/login'); return; }
      await Promise.all([loadStats(), loadHistory()]);
    } catch {
      router.push('/admin/login');
    }
  }

  async function loadStats() {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/users`, { headers: { 'x-auth-uid': uid! } });
      if (res.ok) {
        const data = await res.json();
        const users: NotiUser[] = Array.isArray(data) ? data.map((u: Record<string, unknown>) => ({
          id: String(u.id || u.uid || ''),
          name: String(u.name || 'Unknown'),
          email: String(u.email || ''),
          balance: Number(u.balance || 0),
        })) : [];
        setAllUsers(users);
        setStatUsers(users.length);
      }
    } catch { /* ignore */ }
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/notifications/count`, { headers: { 'x-auth-uid': uid! } });
      if (res.ok) {
        const data = await res.json();
        setStatTotal(data.count || 0);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function loadHistory() {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/notifications/history`, { headers: { 'x-auth-uid': uid! } });
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
  }

  function filterUsers(val: string) {
    setUserSearch(val);
    if (val.length < 2) { setUserSearchResults([]); return; }
    const sk = val.toLowerCase();
    const matches = allUsers.filter((u) =>
      u.name.toLowerCase().includes(sk) || u.email.toLowerCase().includes(sk)
    );
    setUserSearchResults(matches.slice(0, 20));
  }

  function selectUser(id: string, name: string) {
    setSelectedUserId(id);
    setSelectedUserName(name);
    setUserSearch('');
    setUserSearchResults([]);
  }

  function clearUserSelect() {
    setSelectedUserId(null);
    setSelectedUserName('');
  }

  function useTemplate(type: string) {
    const templates: Record<string, { type: string; title: string; msg: string; link?: string }> = {
      update: { type: 'update', title: 'Protocol Update', msg: 'A new update has been posted. Check the Updates section.', link: 'updates.html' },
      poll: { type: 'poll', title: 'New Poll is Live!', msg: 'Your vote matters! Cast your vote now.' },
      contest: { type: 'update', title: '🏆 Referral Contest Active!', msg: 'Invite friends and climb the leaderboard to win POL rewards!', link: 'contests.html' },
      warning: { type: 'personal', title: '⚠️ Important Notice', msg: 'Please review your account. Action required.' },
    };
    const t = templates[type];
    if (!t) return;
    setNotiType(t.type);
    setTitle(t.title);
    setMessage(t.msg);
    if (t.link) {
      setLinkOn(true);
      setLinkUrl(t.link);
      setLinkTitle(t.title);
    }
  }

  async function sendNotification() {
    if (!title.trim() || !message.trim()) { showToast('Title and Message required!', 'error'); return; }
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({
          userId: selectedUserId || 'all',
          type: notiType,
          title: title.trim(),
          message: message.trim(),
          link: linkOn ? linkUrl : '',
          linkTitle: linkOn ? linkTitle : '',
        }),
      });
      if (!res.ok) throw new Error('Failed');
      showToast('Notification sent!');
      clearForm();
      loadStats();
      loadHistory();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    }
  }

  function clearForm() {
    setTitle('');
    setMessage('');
    setLinkOn(false);
    setLinkTitle('');
    setLinkUrl('');
    clearUserSelect();
  }

  async function deleteNoti(id: string) {
    if (!confirm('Delete this notification?')) return;
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/notifications/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed');
      showToast('Deleted!');
      loadHistory();
      loadStats();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    }
  }

  if (loading) return <Loading text="Loading notifications..." />;

  const showPreview = title.trim() || message.trim();

  return (
    <div className="min-h-screen bg-[#03040a] text-white">
      {/* Sidebar (mobile-friendly tabs) */}
      <div className="flex gap-2 p-4 bg-[rgba(10,12,25,0.95)] border-b border-white/10 sticky top-0 z-50">
        {([
          { key: 'send', label: '🚀 Send' },
          { key: 'history', label: '📜 History' },
          { key: 'users', label: '👥 Users' },
        ] as const).map((p) => (
          <button key={p.key} onClick={() => setActivePage(p.key)} className={`flex-1 py-3 text-center rounded-xl text-sm font-bold cursor-pointer transition-all border-none font-[family-name:var(--font-inter)] ${activePage === p.key ? 'bg-white/5 text-white border-r-[3px] border-r-[var(--primary)]' : 'bg-transparent text-white/50 hover:text-white'}`}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="p-5 md:p-7 max-w-[1000px] mx-auto">
        {/* SEND PAGE */}
        {activePage === 'send' && (
          <>
            <h1 className="font-[family-name:var(--font-space-grotesk)] text-[28px] font-extrabold mb-6">Send Notification</h1>

            <div className="grid grid-cols-2 gap-3.5 mb-7">
              <Card className="text-center"><div className="text-xs text-white/50 uppercase tracking-wider">Total Sent</div><div className="font-[family-name:var(--font-space-grotesk)] text-[32px] font-extrabold mt-1 text-[var(--primary)]">{statTotal}</div></Card>
              <Card className="text-center"><div className="text-xs text-white/50 uppercase tracking-wider">Total Users</div><div className="font-[family-name:var(--font-space-grotesk)] text-[32px] font-extrabold mt-1 text-green-500">{statUsers}</div></Card>
            </div>

            <Card>
              <div className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold mb-2.5">Quick Templates</div>
              <div className="flex gap-2 flex-wrap mb-4">
                {[
                  { key: 'update', label: '📢 Update' },
                  { key: 'poll', label: '📊 Poll' },
                  { key: 'contest', label: '🏆 Contest' },
                  { key: 'warning', label: '⚠️ Warning' },
                ].map((t) => (
                  <button key={t.key} onClick={() => useTemplate(t.key)} className="px-4 py-2 rounded-[10px] text-xs font-bold bg-white/[0.04] border border-white/[0.1] text-white/70 cursor-pointer hover:bg-[var(--primary)]/10 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all">
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="mb-3.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Target</label>
                <div className="relative">
                  <input type="text" value={userSearch} onChange={(e) => filterUsers(e.target.value)} placeholder="Search user by name or email..." className="w-full py-3 px-3.5 rounded-[10px] border border-white/[0.1] bg-white/[0.03] text-white text-sm outline-none focus:border-[var(--primary)]" />
                  {userSearchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-[#0b0d18] border border-white/[0.1] rounded-[10px] max-h-[200px] overflow-y-auto z-50 mt-1">
                      {userSearchResults.map((u) => (
                        <div key={u.id} onClick={() => selectUser(u.id, u.name)} className="px-3.5 py-2.5 cursor-pointer border-b border-white/[0.03] hover:bg-[var(--primary)]/8 text-[13px]">
                          <div className="font-semibold">{u.name}</div>
                          <div className="text-[11px] text-white/35">{u.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedUserId && (
                  <div className="flex items-center gap-2.5 mt-1.5 px-3.5 py-2.5 bg-[var(--primary)]/8 border border-[var(--primary)]/20 rounded-[10px]">
                    <div><div className="font-semibold text-[13px]">{selectedUserName}</div></div>
                    <button onClick={clearUserSelect} className="ml-auto bg-transparent border-none text-white/30 cursor-pointer text-lg hover:text-red-500">&times;</button>
                  </div>
                )}
                <div className="text-[11px] text-white/30 mt-1">{selectedUserId ? 'Selected: ' + selectedUserName : 'All Users'}</div>
              </div>

              <div className="mb-3.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Type</label>
                <select value={notiType} onChange={(e) => setNotiType(e.target.value)} className="w-full py-3 px-3.5 rounded-[10px] border border-white/[0.1] bg-white/[0.03] text-white text-sm outline-none focus:border-[var(--primary)]">
                  <option value="update">📢 Update</option>
                  <option value="poll">📊 Poll</option>
                  <option value="personal">💬 Personal</option>
                </select>
              </div>

              <div className="mb-3.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title..." className="w-full py-3 px-3.5 rounded-[10px] border border-white/[0.1] bg-white/[0.03] text-white text-sm outline-none focus:border-[var(--primary)]" />
              </div>

              <div className="mb-3.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Message</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your message..." className="w-full min-h-[100px] py-3 px-3.5 rounded-[10px] border border-white/[0.1] bg-white/[0.03] text-white text-sm outline-none focus:border-[var(--primary)] resize-vertical" />
              </div>

              <div className="flex items-center gap-3 mt-3 mb-3.5">
                <label className="relative inline-block w-10 h-[22px] flex-shrink-0 cursor-pointer">
                  <input type="checkbox" checked={linkOn} onChange={(e) => { setLinkOn(e.target.checked); if (!e.target.checked) { setLinkTitle(''); setLinkUrl(''); } }} className="opacity-0 w-0 h-0 absolute" />
                  <span className={`absolute inset-0 rounded-[22px] cursor-pointer transition-all ${linkOn ? 'bg-[var(--primary)]' : 'bg-white/10'}`}>
                    <span className={`absolute left-[3px] top-[3px] w-4 h-4 rounded-full transition-all ${linkOn ? 'translate-x-[18px] bg-black' : 'bg-white/40'}`} />
                  </span>
                </label>
                <span className="text-xs text-white/50">Include Link</span>
              </div>
              {linkOn && (
                <div className="mb-3.5">
                  <div className="mb-2.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Link Title</label>
                    <input type="text" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} placeholder="e.g. View Update" className="w-full py-3 px-3.5 rounded-[10px] border border-white/[0.1] bg-white/[0.03] text-white text-sm outline-none focus:border-[var(--primary)]" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Link URL</label>
                    <input type="text" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="e.g. updates.html" className="w-full py-3 px-3.5 rounded-[10px] border border-white/[0.1] bg-white/[0.03] text-white text-sm outline-none focus:border-[var(--primary)]" />
                  </div>
                </div>
              )}

              {showPreview && (
                <div className="bg-white/[0.03] border border-white/[0.1] rounded-[14px] p-4 mt-3.5">
                  <div className="text-[9px] text-white/30 font-extrabold uppercase tracking-wider mb-2">Preview</div>
                  <div className="font-bold mb-1">{title || '(no title)'}</div>
                  <div className="text-xs text-white/50">{message || '(no message)'}</div>
                  {linkOn && linkUrl && <a href="#" onClick={(e) => e.preventDefault()} className="text-[11px] text-[var(--secondary)] underline mt-1.5 block">{linkTitle || linkUrl}</a>}
                </div>
              )}

              <div className="flex gap-2.5 mt-5">
                <Button onClick={sendNotification} className="flex-1">🚀 Send Now</Button>
                <Button variant="secondary" onClick={clearForm} className="flex-1">Clear</Button>
              </div>
            </Card>
          </>
        )}

        {/* HISTORY PAGE */}
        {activePage === 'history' && (
          <>
            <h1 className="font-[family-name:var(--font-space-grotesk)] text-[28px] font-extrabold mb-6">History</h1>
            <Card padding="sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead><tr>{['Type', 'Title', 'Target', 'Link', 'Time', 'Actions'].map((h) => <th key={h} className="text-left py-3 px-2.5 text-white/50 border-b border-white/[0.1] text-[11px] uppercase tracking-wider">{h}</th>)}</tr></thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-8 text-white/30">No notifications yet</td></tr>
                    ) : history.map((n) => (
                      <tr key={n.id} className="border-b border-white/[0.03]">
                        <td className="py-3 px-2.5">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${n.type === 'update' ? 'bg-[var(--secondary)]/15 text-[var(--secondary)]' : n.type === 'poll' ? 'bg-green-500/15 text-green-500' : 'bg-yellow-500/15 text-yellow-500'}`}>
                            {n.type === 'update' ? 'Update' : n.type === 'poll' ? 'Poll' : 'Personal'}
                          </span>
                        </td>
                        <td className="py-3 px-2.5 font-bold">{n.title || '-'}</td>
                        <td className="py-3 px-2.5">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${n.userId === 'all' ? 'bg-green-500/15 text-green-500' : 'bg-[var(--primary)]/15 text-[var(--primary)]'}`}>
                            {n.userId === 'all' ? 'All' : 'User'}
                          </span>
                        </td>
                        <td className="py-3 px-2.5 text-[var(--secondary)] text-xs">{n.linkTitle || n.link || <span className="opacity-20">-</span>}</td>
                        <td className="py-3 px-2.5 text-[11px] opacity-40 whitespace-nowrap">{n.createdAt ? new Date(n.createdAt).toLocaleString() : '-'}</td>
                        <td className="py-3 px-2.5">
                          <button onClick={() => deleteNoti(n.id)} className="px-3 py-1.5 bg-red-500/15 text-red-500 border-none rounded-lg text-[11px] font-bold cursor-pointer hover:bg-red-500/25 transition-colors">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* USERS PAGE */}
        {activePage === 'users' && (
          <>
            <h1 className="font-[family-name:var(--font-space-grotesk)] text-[28px] font-extrabold mb-6">Users</h1>
            <Card padding="sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead><tr>{['Name', 'Email', 'Balance'].map((h) => <th key={h} className="text-left py-3 px-2.5 text-white/50 border-b border-white/[0.1] text-[11px] uppercase tracking-wider">{h}</th>)}</tr></thead>
                  <tbody>
                    {allUsers.length === 0 ? (
                      <tr><td colSpan={3} className="text-center py-8 text-white/30">No users found</td></tr>
                    ) : allUsers.map((u) => (
                      <tr key={u.id} className="border-b border-white/[0.03]">
                        <td className="py-3 px-2.5 font-bold">{u.name}</td>
                        <td className="py-3 px-2.5 text-xs opacity-50">{u.email}</td>
                        <td className="py-3 px-2.5 font-bold text-[var(--primary)]">{u.balance.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
      {ToastComponent}
    </div>
  );
}
