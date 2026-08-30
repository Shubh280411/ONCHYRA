'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { detectApiUrl, formatTimeAgo } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';

interface Update {
  id: string;
  title: string;
  message: string;
  type: string;
  target: string;
  link?: string;
  createdAt: number;
  readBy?: Record<string, boolean>;
}

const TYPE_STYLES: Record<string, { bg: string; fg: string }> = {
  info: { bg: 'rgba(96,165,250,0.15)', fg: '#60a5fa' },
  success: { bg: 'rgba(34,197,94,0.15)', fg: '#22c55e' },
  warning: { bg: 'rgba(251,191,36,0.15)', fg: '#fbbf24' },
  error: { bg: 'rgba(239,68,68,0.15)', fg: '#ef4444' },
  achievement: { bg: 'rgba(167,139,250,0.15)', fg: '#a78bfa' },
};

const S = {
  card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 },
  input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: "'Inter',sans-serif" },
  btn: { padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: "'Inter',sans-serif" as const, transition: 'all 0.2s' },
};

export default function AdminUpdatesPage() {
  const { uid } = useAuth();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [linkOn, setLinkOn] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const showToast = (msg: string, err = false) => { setToast({ msg, err }); setTimeout(() => setToast(null), 3000); };

  const loadUpdates = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/stats`, { headers: { 'x-auth-uid': uid } });
      if (res.ok) {
        const data = await res.json();
        const recentDeposits = (data.recentDeposits || []) as Update[];
        const allNotiRes = await fetch(`${apiUrl}/api/admin/notifications/history`, { headers: { 'x-auth-uid': uid } });
        if (allNotiRes.ok) {
          const notiData = await allNotiRes.json();
          setUpdates((notiData.notifications || notiData || []).map((n: Record<string, unknown>) => ({
            id: String(n.id || ''),
            title: String(n.title || n.message || ''),
            message: String(n.message || ''),
            type: String(n.type || 'info'),
            target: String(n.user_id || 'all'),
            link: n.link as string | undefined,
            createdAt: Number(n.created_at || 0),
            readBy: n.read_by as Record<string, boolean> | undefined,
          })));
        } else {
          setUpdates([]);
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [uid]);

  useEffect(() => { loadUpdates(); }, [loadUpdates]);

  async function handlePost() {
    if (!title.trim() || !message.trim()) { showToast('Title and message required', true); return; }
    setPosting(true);
    try {
      const apiUrl = detectApiUrl();
      const body: Record<string, unknown> = {
        title: title.trim(),
        message: message.trim(),
        type,
        link: linkOn ? linkUrl.trim() : '',
      };
      const res = await fetch(`${apiUrl}/api/admin/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        showToast('Update posted successfully!');
        setTitle(''); setMessage(''); setLinkOn(false); setLinkUrl('');
        loadUpdates();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed', true);
      }
    } catch { showToast('Network error', true); }
    setPosting(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this update?')) return;
    try {
      const apiUrl = detectApiUrl();
      await fetch(`${apiUrl}/api/admin/notifications/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({ id }),
      });
      showToast('Deleted');
      setUpdates(prev => prev.filter(u => u.id !== id));
    } catch { showToast('Delete failed', true); }
  }

  const stats = {
    total: updates.length,
    thisWeek: updates.filter(u => Date.now() - u.createdAt < 7 * 86400000).length,
    byType: Object.entries(TYPE_STYLES).map(([t, _]) => ({ type: t, count: updates.filter(u => u.type === t).length })),
  };

  return (
    <AdminLayout title="Platform Updates">
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '14px 24px', borderRadius: 12, background: toast.err ? 'rgba(239,68,68,0.9)' : 'rgba(34,197,94,0.9)', color: '#fff', fontSize: 14, fontWeight: 600, backdropFilter: 'blur(12px)' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Updates', value: stats.total, color: '#a78bfa' },
          { label: 'This Week', value: stats.thisWeek, color: '#60a5fa' },
          { label: 'Info', value: stats.byType.find(b => b.type === 'info')?.count || 0, color: '#60a5fa' },
          { label: 'Warnings', value: stats.byType.find(b => b.type === 'warning')?.count || 0, color: '#fbbf24' },
        ].map((s, i) => (
          <div key={i} style={{ ...S.card, flex: '1 1 160px', minWidth: 160 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Post Form */}
        <div style={S.card}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#fff' }}>Post New Update</div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Title</label>
            <input style={S.input} value={title} onChange={e => setTitle(e.target.value)} placeholder="Update title..." />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Message</label>
            <textarea style={{ ...S.input, minHeight: 100, resize: 'vertical' as const }} value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your update..." />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(TYPE_STYLES).map(([t, c]) => (
                <button key={t} onClick={() => setType(t)} style={{ ...S.btn, padding: '8px 14px', fontSize: 12, background: type === t ? c.bg : 'rgba(255,255,255,0.05)', color: type === t ? c.fg : 'rgba(255,255,255,0.4)', border: `1px solid ${type === t ? c.fg + '40' : 'rgba(255,255,255,0.06)'}` }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              <input type="checkbox" checked={linkOn} onChange={e => setLinkOn(e.target.checked)} style={{ accentColor: '#a78bfa' }} />
              Include Link
            </label>
            {linkOn && (
              <input style={{ ...S.input, marginTop: 8 }} value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." />
            )}
          </div>

          <button onClick={handlePost} disabled={posting} style={{ ...S.btn, background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#fff', width: '100%', opacity: posting ? 0.6 : 1 }}>
            {posting ? 'Posting...' : 'Post Update'}
          </button>
        </div>

        {/* Recent Updates */}
        <div style={S.card}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#fff' }}>Recent Updates</div>
          {loading ? (
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, padding: 20, textAlign: 'center' }}>Loading...</div>
          ) : updates.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, padding: 40, textAlign: 'center' }}>No updates yet</div>
          ) : (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {updates.slice(0, 20).map(u => {
                const tc = TYPE_STYLES[u.type] || TYPE_STYLES.info;
                return (
                  <div key={u.id} style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ padding: '2px 10px', borderRadius: 6, background: tc.bg, color: tc.fg, fontSize: 11, fontWeight: 600 }}>{u.type}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{u.createdAt ? formatTimeAgo(u.createdAt) : ''}</span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{u.title}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{u.message}</div>
                    </div>
                    <button onClick={() => handleDelete(u.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 8, padding: '6px 12px', fontSize: 11, cursor: 'pointer', marginLeft: 12 }}>Delete</button>
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
