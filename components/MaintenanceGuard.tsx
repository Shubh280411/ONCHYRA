'use client';

import { useEffect, useState, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { detectApiUrl } from '@/lib/utils';

interface MaintenanceData {
  enabled: boolean;
  message?: string;
  endAt?: number;
  startedAt?: number;
}

const SKIP_PATHS = ['/admin', '/login', '/register', '/api'];

export default function MaintenanceGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [maintenance, setMaintenance] = useState<MaintenanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  const shouldSkip = SKIP_PATHS.some(p => pathname.startsWith(p));

  const checkMaintenance = useCallback(async () => {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/maintenance`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.enabled && data.endAt && Date.now() > data.endAt) {
          setMaintenance({ enabled: false });
        } else {
          setMaintenance(data);
        }
      } else {
        setMaintenance({ enabled: false });
      }
    } catch {
      setMaintenance({ enabled: false });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (shouldSkip) { setLoading(false); return; }
    checkMaintenance();
    const interval = setInterval(checkMaintenance, 15000);
    return () => clearInterval(interval);
  }, [checkMaintenance, shouldSkip]);

  useEffect(() => {
    if (shouldSkip || !maintenance?.enabled) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [shouldSkip, maintenance?.enabled]);

  if (shouldSkip) return <>{children}</>;
  if (loading) return null;
  if (!maintenance?.enabled) return <>{children}</>;

  const remaining = maintenance.endAt ? Math.max(0, maintenance.endAt - now) : null;
  const remainingD = remaining !== null ? Math.floor(remaining / 86400000) : null;
  const remainingH = remaining !== null ? Math.floor((remaining % 86400000) / 3600000) : null;
  const remainingM = remaining !== null ? Math.floor((remaining % 3600000) / 60000) : null;
  const remainingS = remaining !== null ? Math.floor((remaining % 60000) / 1000) : null;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#05060f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background orbs */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)',
        top: '-200px', right: '-200px', animation: 'maintFloat 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 70%)',
        bottom: '-150px', left: '-150px', animation: 'maintFloat 10s ease-in-out infinite reverse',
      }} />

      <style>{`
        @keyframes maintFloat { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(30px, -20px) scale(1.05); } }
        @keyframes maintPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.08); } }
        @keyframes maintGlow { 0%, 100% { box-shadow: 0 0 20px rgba(239,68,68,0.3), 0 0 60px rgba(239,68,68,0.1); } 50% { box-shadow: 0 0 30px rgba(239,68,68,0.5), 0 0 80px rgba(239,68,68,0.2); } }
      `}</style>

      <div style={{
        maxWidth: 480,
        width: '100%',
        textAlign: 'center' as const,
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Animated wrench icon */}
        <div style={{
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(239,68,68,0.1)',
          border: '2px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 32px',
          animation: 'maintGlow 3s ease-in-out infinite',
        }}>
          <div style={{ animation: 'maintPulse 2s ease-in-out infinite' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 36,
          fontWeight: 800,
          color: '#fff',
          marginBottom: 12,
          letterSpacing: -0.5,
        }}>
          Under Maintenance
        </h1>

        {/* Decorative line */}
        <div style={{
          width: 60, height: 3, borderRadius: 2,
          background: 'linear-gradient(90deg, #ef4444, #fbbf24)',
          margin: '0 auto 28px',
        }} />

        {/* Message */}
        <p style={{
          fontSize: 16,
          color: 'rgba(255,255,255,0.5)',
          lineHeight: 1.7,
          marginBottom: 32,
          maxWidth: 400,
          margin: '0 auto 32px',
        }}>
          {maintenance.message || 'We are performing scheduled maintenance to improve your experience. We\'ll be back shortly.'}
        </p>

        {/* Countdown */}
        {remainingS !== null && remainingS >= 0 && (
          <div style={{
            display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 36, flexWrap: 'wrap',
          }}>
            {[
              ...(remainingD !== null && remainingD > 0 ? [{ label: 'DAYS', value: remainingD }] : []),
              { label: 'HOURS', value: remainingH },
              { label: 'MINUTES', value: remainingM },
              { label: 'SECONDS', value: remainingS },
            ].map((item, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14, padding: '16px 20px', minWidth: 80,
              }}>
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 32, fontWeight: 800, color: '#ef4444',
                  lineHeight: 1,
                }}>
                  {String(item.value ?? 0).padStart(2, '0')}
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)',
                  letterSpacing: 1.5, marginTop: 6,
                }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Status indicator */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 20,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.15)',
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#ef4444',
            animation: 'maintPulse 1.5s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
            Auto-refreshes every 15 seconds
          </span>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 48, fontSize: 12, color: 'rgba(255,255,255,0.2)',
        }}>
          ONCHYRA — Decentralized Referral Protocol
        </div>
      </div>
    </div>
  );
}
