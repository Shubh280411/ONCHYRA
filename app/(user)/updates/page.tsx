'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl, formatTimeAgo } from '@/lib/utils';
import Loading from '@/components/ui/Loading';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

const TYPE_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  info: { bg: 'rgba(96,165,250,0.12)', fg: '#60a5fa', label: 'Info' },
  success: { bg: 'rgba(34,197,94,0.12)', fg: '#22c55e', label: 'Success' },
  warning: { bg: 'rgba(251,191,36,0.12)', fg: '#fbbf24', label: 'Warning' },
  error: { bg: 'rgba(239,68,68,0.12)', fg: '#ef4444', label: 'Error' },
  achievement: { bg: 'rgba(167,139,250,0.12)', fg: '#a78bfa', label: 'Achievement' },
  rank: { bg: 'rgba(251,191,36,0.12)', fg: '#fbbf24', label: 'Rank' },
  commission: { bg: 'rgba(34,197,94,0.12)', fg: '#22c55e', label: 'Commission' },
  system: { bg: 'rgba(255,255,255,0.06)', fg: 'rgba(255,255,255,0.5)', label: 'System' },
  personal: { bg: 'rgba(167,139,250,0.12)', fg: '#a78bfa', label: 'Personal' },
  update: { bg: 'rgba(96,165,250,0.12)', fg: '#60a5fa', label: 'Update' },
  poll: { bg: 'rgba(34,197,94,0.12)', fg: '#22c55e', label: 'Poll' },
  danger: { bg: 'rgba(239,68,68,0.12)', fg: '#ef4444', label: 'Danger' },
  announcement: { bg: 'rgba(251,191,36,0.12)', fg: '#fbbf24', label: 'Announcement' },
};

const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  general: { bg: 'rgba(96,165,250,0.12)', fg: '#60a5fa' },
  maintenance: { bg: 'rgba(251,191,36,0.12)', fg: '#fbbf24' },
  warning: { bg: 'rgba(239,68,68,0.12)', fg: '#ef4444' },
  feature: { bg: 'rgba(34,197,94,0.12)', fg: '#22c55e' },
  promo: { bg: 'rgba(167,139,250,0.12)', fg: '#a78bfa' },
};

interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  image: string;
  category: string;
  created_at: number;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  link_title: string;
  created_at: number;
}

function renderTextWithLineBreaks(text: string): ReactNode {
  if (!text) return null;
  const paragraphs = text.split(/\n\s*\n/);
  return paragraphs.map((para, i) => {
    const lines = para.split('\n');
    return (
      <div key={i} style={{ marginBottom: i < paragraphs.length - 1 ? 10 : 0 }}>
        {lines.map((line, j) => (
          <span key={j}>
            {line}
            {j < lines.length - 1 && <br />}
          </span>
        ))}
      </div>
    );
  });
}

export default function UpdatesPage() {
  const { uid } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const apiUrl = detectApiUrl();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'announcements' | 'notifications'>('announcements');
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!uid) { setLoading(false); return; }
    setLoading(true);
    try {
      const [notiRes, annRes] = await Promise.all([
        fetch(`${apiUrl}/api/notifications/${uid}`) as Promise<Response>,
        fetch(`${apiUrl}/api/announcements`) as Promise<Response>,
      ]);
      if (notiRes.ok) {
        const data = await notiRes.json();
        setNotifications(data.notifications || []);
      }
      if (annRes.ok) {
        const data = await annRes.json();
        setAnnouncements(data.announcements || []);
      }
    } catch {}
    setLoading(false);
  }, [apiUrl, uid]);

  useEffect(() => {
    if (!uid) return;
    loadData();
  }, [uid, loadData]);

  async function deleteNotification(id: string) {
    if (deleting) return;
    setDeleting(id);
    try {
      const res = await fetch(`${apiUrl}/api/notifications/user-delete/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        showToast('Deleted', 'success');
      } else {
        showToast('Failed to delete', 'error');
      }
    } catch {
      showToast('Failed to delete', 'error');
    }
    setDeleting(null);
  }

  async function deleteAnnouncement(id: string) {
    if (deleting) return;
    setDeleting(id);
    try {
      const res = await fetch(`${apiUrl}/api/announcements/delete/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });
      if (res.ok) {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
        showToast('Deleted', 'success');
      } else {
        showToast('Failed to delete', 'error');
      }
    } catch {
      showToast('Failed to delete', 'error');
    }
    setDeleting(null);
  }

  if (loading) return <Loading text="Loading updates..." />;

  const allNotifications = notifications.filter(n => n.type !== 'announcement');

  return (
    <div style={{ paddingBottom: 50 }}>
      {ToastComponent}

      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{
          fontFamily: SG, fontWeight: 800, fontSize: 22,
          background: 'linear-gradient(135deg,#60a5fa,#a78bfa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Updates
        </div>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="14" height="14" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: 4, marginBottom: 18 }}>
        {([
          { key: 'announcements' as const, label: 'Announcements', count: announcements.length },
          { key: 'notifications' as const, label: 'Notifications', count: allNotifications.length },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              flex: 1, padding: '10px 8px', textAlign: 'center', borderRadius: 11,
              fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: '0.2s', border: 'none',
              color: activeTab === t.key ? '#fbbf24' : 'rgba(255,255,255,0.3)',
              background: activeTab === t.key ? 'rgba(251,191,36,0.12)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}
          >
            {t.key === 'announcements' ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            )}
            {t.label}
            {t.count > 0 && (
              <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 8, background: 'rgba(255,255,255,0.08)' }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {announcements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: 'rgba(255,255,255,0.2)', fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              No announcements yet
            </div>
          ) : (
            announcements.map((ann) => {
              const cat = ann.category || 'general';
              const catColor = CATEGORY_COLORS[cat] || CATEGORY_COLORS.general;
              return (
                <div
                  key={ann.id}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 18, overflow: 'hidden',
                  }}
                >
                  {/* Image */}
                  {ann.image && (
                    <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden' }}>
                      <img
                        src={ann.image}
                        alt={ann.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  )}

                  <div style={{ padding: 18 }}>
                    {/* Category + Time + Delete */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 10px', borderRadius: 20,
                        background: catColor.bg, fontSize: 9, fontWeight: 700,
                        color: catColor.fg, letterSpacing: 0.5, textTransform: 'uppercase' as const,
                      }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={catColor.fg} strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                        {cat}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                          {ann.created_at ? formatTimeAgo(ann.created_at) : ''}
                        </span>
                        <button
                          onClick={() => deleteAnnouncement(ann.id)}
                          disabled={deleting === ann.id}
                          style={{
                            width: 26, height: 26, borderRadius: 8,
                            background: deleting === ann.id ? 'rgba(239,68,68,0.05)' : 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: deleting === ann.id ? 'not-allowed' : 'pointer',
                            transition: '0.2s', flexShrink: 0,
                          }}
                          onMouseEnter={e => { if (deleting !== ann.id) e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
                          onMouseLeave={e => { if (deleting !== ann.id) e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <div style={{ fontFamily: SG, fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>
                      {ann.title}
                    </div>

                    {/* Message with line breaks */}
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                      {renderTextWithLineBreaks(ann.message)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {allNotifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: 'rgba(255,255,255,0.2)', fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              No notifications yet
            </div>
          ) : (
            allNotifications.map((n) => {
              const type = n.type || 'info';
              const tc = TYPE_COLORS[type] || TYPE_COLORS.info;
              return (
                <div
                  key={n.id}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16, padding: 16,
                    display: 'flex', flexDirection: 'column', gap: 10,
                  }}
                >
                  {/* Top row: badge + time + delete */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 20, background: tc.bg,
                      fontSize: 9, fontWeight: 700, color: tc.fg,
                      letterSpacing: 0.5, textTransform: 'uppercase' as const,
                    }}>
                      {type === 'achievement' || type === 'rank' ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={tc.fg} strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      ) : type === 'success' || type === 'commission' ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={tc.fg} strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : type === 'error' || type === 'danger' ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={tc.fg} strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={tc.fg} strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                      )}
                      {tc.label}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                        {n.created_at ? formatTimeAgo(n.created_at) : ''}
                      </span>
                      <button
                        onClick={() => deleteNotification(n.id)}
                        disabled={deleting === n.id}
                        style={{
                          width: 26, height: 26, borderRadius: 8,
                          background: deleting === n.id ? 'rgba(239,68,68,0.05)' : 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: deleting === n.id ? 'not-allowed' : 'pointer',
                          transition: '0.2s', flexShrink: 0,
                        }}
                        onMouseEnter={e => { if (deleting !== n.id) e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
                        onMouseLeave={e => { if (deleting !== n.id) e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <div style={{ fontFamily: SG, fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                    {n.title}
                  </div>

                  {/* Message with line breaks */}
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                    {renderTextWithLineBreaks(n.message)}
                  </div>

                  {/* Link button */}
                  {n.link ? (
                    <Link
                      href={n.link}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 10,
                        background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)',
                        color: '#60a5fa', fontSize: 11, fontWeight: 700,
                        textDecoration: 'none', alignSelf: 'flex-start',
                      }}
                    >
                      {n.link_title || 'View Details'}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </Link>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
