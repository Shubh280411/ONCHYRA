'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl, formatUSD } from '@/lib/utils';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

interface RoiStatus {
  active: boolean;
  packageId: string;
  packagePrice: number;
  dailyRoi: number;
  totalRoi: number;
  totalClaimed: number;
  remainingDays: number;
  daysCompleted: number;
  roiStartedAt: number;
  nextClaimAvailable: boolean;
  periodComplete: boolean;
  roiMaxed: boolean;
}

interface RoiHistoryEntry {
  date: string;
  amount: number;
  dayNumber: number;
}

export default function RoiPage() {
  const { uid } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const apiUrl = detectApiUrl();

  const [status, setStatus] = useState<RoiStatus | null>(null);
  const [history, setHistory] = useState<RoiHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const loadData = useCallback(async () => {
    if (!uid) return;
    try {
      const [statusRes, historyRes] = await Promise.all([
        fetch(`${apiUrl}/api/roi/status/${uid}`),
        fetch(`${apiUrl}/api/roi/history/${uid}`),
      ]);
      if (statusRes.ok) setStatus(await statusRes.json());
      if (historyRes.ok) {
        const d = await historyRes.json();
        setHistory(d.history || d || []);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [uid, apiUrl]);

  useEffect(() => {
    if (!uid) return;
    loadData();
  }, [uid, loadData]);

  const handleClaim = async () => {
    if (!uid || claiming) return;
    setClaiming(true);
    try {
      const res = await fetch(`${apiUrl}/api/roi/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Claim failed');
      showToast(`ROI claimed! +${status?.dailyRoi?.toFixed(4) || '0'} ONC`);
      loadData();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Claim failed', 'error');
    }
    setClaiming(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80, gap: 12 }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.05)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 600 }}>Loading ROI data...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const noPackage = !status || !status.active;
  const totalDays = (status?.daysCompleted || 0) + (status?.remainingDays || 0);
  const progressPct = totalDays > 0 ? Math.round(((status?.daysCompleted || 0) / totalDays) * 100) : 0;

  return (
    <div style={{ fontFamily: INTER }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>
      {ToastComponent}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div>
            <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 18 }}>ROI Dashboard</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Track and claim your daily returns</div>
          </div>
        </div>

        {/* No Active Package */}
        {noPackage ? (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div style={{ fontFamily: SG, fontWeight: 800, fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>No Active ROI</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', lineHeight: 1.6 }}>
              Purchase a package to start earning daily ROI returns on your investment.
            </div>
            <a href="/packages" style={{
              display: 'inline-block', marginTop: 16, padding: '12px 28px', borderRadius: 14,
              background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
              color: '#000', fontWeight: 900, fontSize: 13, textDecoration: 'none', fontFamily: SG,
            }}>Browse Packages</a>
          </div>
        ) : (
          <>
            {/* Active Package Card */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.15), transparent)', pointerEvents: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, position: 'relative' }}>
                <span style={{ fontFamily: SG, fontWeight: 800, fontSize: 15, textTransform: 'capitalize' as const }}>{status!.packageId}</span>
                <span style={{ fontSize: 7, fontWeight: 800, padding: '3px 10px', borderRadius: 6, background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', letterSpacing: 0.5 }}>ACTIVE</span>
                {status!.periodComplete && (
                  <span style={{ fontSize: 7, fontWeight: 800, padding: '3px 10px', borderRadius: 6, background: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)', letterSpacing: 0.5, marginLeft: 'auto' }}>PERIOD COMPLETE</span>
                )}
                {status!.roiMaxed && (
                  <span style={{ fontSize: 7, fontWeight: 800, padding: '3px 10px', borderRadius: 6, background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)', letterSpacing: 0.5, marginLeft: 'auto' }}>ROI MAXED</span>
                )}
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, position: 'relative' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Daily ROI</div>
                  <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 15, color: '#22c55e', marginTop: 4 }}>{status!.dailyRoi.toFixed(4)}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>ONC</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Total Earned</div>
                  <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 15, color: '#fbbf24', marginTop: 4 }}>{status!.totalClaimed.toFixed(4)}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>ONC</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Remaining</div>
                  <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 15, color: '#60a5fa', marginTop: 4 }}>{status!.remainingDays}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>days</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginTop: 16, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>Day {status!.daysCompleted} of {totalDays}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{progressPct}%</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', height: 8, borderRadius: 20, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, #22c55e, #4ade80)', borderRadius: 20, transition: '0.8s' }} />
                </div>
              </div>

              {/* Total ROI Cap */}
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Total ROI Cap</span>
                <span style={{ fontFamily: SG, fontWeight: 900, fontSize: 13, color: '#a78bfa' }}>${status!.totalRoi.toFixed(2)}</span>
              </div>

              {/* Last Claim */}
              {status!.roiStartedAt > 0 && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>ROI Started</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{new Date(status!.roiStartedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Claim Button */}
            <button
              onClick={handleClaim}
              disabled={!status!.nextClaimAvailable || claiming}
              style={{
                width: '100%', padding: 18, borderRadius: 18,
                background: status!.nextClaimAvailable
                  ? 'linear-gradient(135deg, #22c55e, #4ade80)'
                  : 'rgba(255,255,255,0.04)',
                color: status!.nextClaimAvailable ? '#000' : 'rgba(255,255,255,0.25)',
                fontWeight: 900, fontSize: 15, cursor: status!.nextClaimAvailable && !claiming ? 'pointer' : 'not-allowed',
                transition: '0.3s', fontFamily: SG, letterSpacing: 0.5,
                border: status!.nextClaimAvailable ? 'none' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {claiming ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Claiming...
                </span>
              ) : status!.nextClaimAvailable ? 'CLAIM ROI' : 'No Claim Available'}
            </button>

            {/* Period Complete Banner */}
            {status!.periodComplete && (
              <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 20, padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 18, color: '#22c55e', marginBottom: 8 }}>ROI Period Completed</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
                  You have completed all {totalDays} days of ROI for {status!.packageId}.
                </div>
                <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 28, color: '#22c55e', marginTop: 16 }}>
                  {status!.totalClaimed.toFixed(4)} <span style={{ fontSize: 14, opacity: 0.5 }}>ONC earned</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* ROI History */}
        {history.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '18px 18px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const }}>ROI History</span>
            </div>
            {history.slice(0, 20).map((entry, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < Math.min(history.length, 20) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: SG, fontWeight: 900, fontSize: 11, color: '#22c55e' }}>
                  D{entry.dayNumber}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>Day {entry.dayNumber} ROI</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{entry.date}</div>
                </div>
                <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 13, color: '#22c55e' }}>+{entry.amount.toFixed(4)} ONC</div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
