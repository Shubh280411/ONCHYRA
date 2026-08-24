'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl, formatTimeAgo } from '@/lib/utils';
import Loading from '@/components/ui/Loading';
import { Notification } from '@/types';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

const TYPE_COLORS: Record<string, { bg: string; fg: string }> = {
  info: { bg: 'rgba(96,165,250,0.12)', fg: '#60a5fa' },
  success: { bg: 'rgba(34,197,94,0.12)', fg: '#22c55e' },
  warning: { bg: 'rgba(251,191,36,0.12)', fg: '#fbbf24' },
  error: { bg: 'rgba(239,68,68,0.12)', fg: '#ef4444' },
  achievement: { bg: 'rgba(167,139,250,0.12)', fg: '#a78bfa' },
  rank: { bg: 'rgba(251,191,36,0.12)', fg: '#fbbf24' },
  commission: { bg: 'rgba(34,197,94,0.12)', fg: '#22c55e' },
  system: { bg: 'rgba(255,255,255,0.06)', fg: 'rgba(255,255,255,0.5)' },
};

function getTypeBadge(type: string) {
  const c = TYPE_COLORS[type] || TYPE_COLORS.info;
  return { bg: c.bg, fg: c.fg, label: type.charAt(0).toUpperCase() + type.slice(1) };
}

export default function UpdatesPage() {
  const { uid } = useAuth();
  const { ToastComponent } = useToast();
  const apiUrl = detectApiUrl();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!apiUrl || !uid) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/notifications/${uid}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || data || []);
      }
    } catch {}
    setLoading(false);
  }, [apiUrl, uid]);

  useEffect(() => {
    if (!uid) return;
    loadData();
  }, [uid, loadData]);

  if (loading) return <Loading text="Loading updates..." />;

  return (
    <div style={{
      fontFamily: INTER,
      background: '#03040a',
      color: 'white',
      minHeight: '100vh',
      padding: '16px',
      paddingBottom: 50,
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(96,165,250,0.06) 0%, transparent 60%)',
    }}>
      {ToastComponent}

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingTop: 8,
      }}>
        <Link
          href="/dashboard"
          style={{
            width: 38,
            height: 38,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
          }}
        >
          <svg width="17" height="17" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <div style={{ fontFamily: SG, fontSize: 15, fontWeight: 800, letterSpacing: 2, color: 'rgba(255,255,255,0.8)' }}>
          UPDATES
        </div>
        <div style={{ width: 38 }} />
      </div>

      {/* Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{
          fontFamily: SG,
          fontWeight: 800,
          fontSize: 22,
          background: 'linear-gradient(135deg,#60a5fa,#a78bfa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Updates
        </div>
        <div style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: 'rgba(96,165,250,0.15)',
          border: '1px solid rgba(96,165,250,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="14" height="14" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: -12, marginBottom: 20 }}>
        {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {notifications.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 16px',
            color: 'rgba(255,255,255,0.2)',
            fontSize: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            No updates yet
          </div>
        ) : (
          notifications.map((n) => {
            const badge = getTypeBadge(n.type || 'info');
            return (
              <div
                key={n.id}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  backdropFilter: 'blur(20px)',
                }}
              >
                {/* Top row: badge + time */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: badge.bg,
                    fontSize: 9,
                    fontWeight: 700,
                    color: badge.fg,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase' as const,
                  }}>
                    {/* Type icon */}
                    {n.type === 'achievement' || n.type === 'rank' ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={badge.fg} strokeWidth="2.5">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ) : n.type === 'success' || n.type === 'commission' ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={badge.fg} strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : n.type === 'error' ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={badge.fg} strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                    ) : (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={badge.fg} strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                    )}
                    {badge.label}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                    {n.createdAt ? formatTimeAgo(n.createdAt) : ''}
                  </div>
                </div>

                {/* Title */}
                <div style={{ fontFamily: SG, fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                  {n.title}
                </div>

                {/* Message */}
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                  {n.message}
                </div>

                {/* Link button */}
                {n.link ? (
                  <Link
                    href={n.link}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 14px',
                      borderRadius: 10,
                      background: 'rgba(96,165,250,0.1)',
                      border: '1px solid rgba(96,165,250,0.2)',
                      color: '#60a5fa',
                      fontSize: 11,
                      fontWeight: 700,
                      textDecoration: 'none',
                      alignSelf: 'flex-start',
                      transition: '0.2s',
                    }}
                  >
                    View Details
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
