'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl, formatUSD } from '@/lib/utils';
import { PACKAGES } from '@/types';
import type React from 'react';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

const PACKAGE_STYLES: Record<string, { glow: string; bg: string; color: string; gradient: string; ring: string }> = {
  starter:  { glow: '#a78bfa', bg: 'rgba(167,139,250,0.12)', color: '#a78bfa', gradient: 'linear-gradient(135deg,#a78bfa,#818cf8)', ring: 'rgba(167,139,250,0.3)' },
  builder:  { glow: '#60a5fa', bg: 'rgba(96,165,250,0.12)', color: '#60a5fa', gradient: 'linear-gradient(135deg,#60a5fa,#38bdf8)', ring: 'rgba(96,165,250,0.3)' },
  pioneer:  { glow: '#f59e0b', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b,#fbbf24)', ring: 'rgba(245,158,11,0.3)' },
  elite:    { glow: '#ec4899', bg: 'rgba(236,72,153,0.12)', color: '#ec4899', gradient: 'linear-gradient(135deg,#ec4899,#f472b6)', ring: 'rgba(236,72,153,0.3)' },
  titan:    { glow: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6', gradient: 'linear-gradient(135deg,#8b5cf6,#a78bfa)', ring: 'rgba(139,92,246,0.3)' },
  dominion: { glow: '#f43f5e', bg: 'rgba(244,63,94,0.12)', color: '#f43f5e', gradient: 'linear-gradient(135deg,#f43f5e,#fb7185)', ring: 'rgba(244,63,94,0.3)' },
  legacy:   { glow: '#fbbf24', bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', gradient: 'linear-gradient(135deg,#fbbf24,#f59e0b)', ring: 'rgba(251,191,36,0.3)' },
};

const ICONS: Record<string, React.JSX.Element> = {
  starter:  <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" fill="#a78bfa" opacity="0.2"/><path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  builder:  <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" fill="#60a5fa" opacity="0.2" stroke="#60a5fa" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5" fill="#60a5fa" opacity="0.2" stroke="#60a5fa" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5" fill="#60a5fa" opacity="0.2" stroke="#60a5fa" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5" fill="#60a5fa" opacity="0.2" stroke="#60a5fa" strokeWidth="1.5"/></svg>,
  pioneer:  <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#f59e0b" opacity="0.15" stroke="#f59e0b" strokeWidth="1.5"/><path d="M12 6v6l4 2" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  elite:    <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 7.1-1.01L12 2z" fill="#ec4899" opacity="0.2"/><path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 7.1-1.01L12 2z" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" fill="#ec4899" opacity="0.4"/></svg>,
  titan:    <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#8b5cf6" opacity="0.15" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  dominion: <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z" fill="#f43f5e" opacity="0.15" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 17l10 5 10-5" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 12l10 5 10-5" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  legacy:   <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="5" fill="#fbbf24" opacity="0.15" stroke="#fbbf24" strokeWidth="1.5"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="8" r="2" fill="#fbbf24" opacity="0.4"/></svg>,
};

const TIER_LABELS: Record<string, string> = {
  starter: 'BRONZE',
  builder: 'SILVER',
  pioneer: 'GOLD',
  elite: 'PLATINUM',
  titan: 'DIAMOND',
  dominion: 'ROYAL',
  legacy: 'LEGENDARY',
};

const ROI_DATA: Record<string, { days: number; totalRoi: number }> = {
  starter: { days: 30, totalRoi: 1.50 },
  builder: { days: 45, totalRoi: 4.50 },
  pioneer: { days: 60, totalRoi: 15 },
  elite: { days: 90, totalRoi: 45 },
  titan: { days: 120, totalRoi: 120 },
  dominion: { days: 180, totalRoi: 450 },
  legacy: { days: 365, totalRoi: 1825 },
};

const CIRCUM = 2 * Math.PI * 34;

export default function PackagesPage() {
  const { uid } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const apiUrl = detectApiUrl();

  const [walletBalance, setWalletBalance] = useState(0);
  const [activePkg, setActivePkg] = useState<string | null>(null);
  const [packageUsage, setPackageUsage] = useState(0);
  const [packageCap, setPackageCap] = useState(0);
  const [packageBoost, setPackageBoost] = useState(1);
  const [purchasedPackages, setPurchasedPackages] = useState<string[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRules, setShowRules] = useState(false);

  const selected = useMemo(() => PACKAGES.find(p => p.id === selectedPkg) || null, [selectedPkg]);
  const active = useMemo(() => PACKAGES.find(p => p.id === activePkg) || null, [activePkg]);

  const gaugePct = useMemo(() => {
    if (packageCap <= 0) return 0;
    return Math.min(100, (packageUsage / packageCap) * 100);
  }, [packageUsage, packageCap]);

  const gaugeColor = gaugePct > 80 ? '#ef4444' : gaugePct > 50 ? '#f59e0b' : '#22c55e';

  const upgradeCredit = useMemo(() => {
    if (!selected || !active) return 0;
    const usagePct = packageUsage / (active.cap || 1);
    if (usagePct < 5) return active.price * 0.7;
    return 0;
  }, [selected, active, packageUsage]);

  const finalPrice = useMemo(() => {
    if (!selected) return 0;
    return Math.max(0, selected.price - upgradeCredit);
  }, [selected, upgradeCredit]);

  const buyLabel = useMemo(() => {
    if (!selected) return 'Select a package';
    if (walletBalance < finalPrice) return `Insufficient Balance (${formatUSD(finalPrice)} needed)`;
    if (upgradeCredit > 0) return `Activate ${formatUSD(selected.price)} (Credit: -${formatUSD(upgradeCredit)})`;
    return `Activate for ${formatUSD(selected.price)}`;
  }, [selected, finalPrice, walletBalance, upgradeCredit]);

  useEffect(() => {
    if (!uid) return;
    loadData();
  }, [uid]);

  async function loadData() {
    setLoading(true);
    try {
      const [userRes, pkgRes] = await Promise.all([
        fetch(`${apiUrl}/api/user/${uid}`),
        fetch(`${apiUrl}/api/packages/user/${uid}`),
      ]);
      if (userRes.ok) {
        const d = await userRes.json();
        setWalletBalance(Number(d.walletBalance) || 0);
      }
      if (pkgRes.ok) {
        const d = await pkgRes.json();
        setActivePkg(d.activePackage || null);
        setPackageUsage(Number(d.packageUsage) || 0);
        setPackageCap(Number(d.packageCap) || 0);
        setPackageBoost(Number(d.packageBoost) || 1);
        setPurchasedPackages(d.purchasedPackages || []);
      }
    } catch { /* silent */ }
    setLoading(false);
  }

  async function purchase() {
    if (!selected || !uid) return;
    setPurchasing(true);
    try {
      const res = await fetch(`${apiUrl}/api/packages/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, packageId: selected.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Purchase failed');
      showToast(`${selected.name} activated! ${selected.boost}x mining boost applied`);
      setSelectedPkg(null);
      loadData();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Purchase failed', 'error');
    }
    setPurchasing(false);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80 }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.05)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 600 }}>Loading packages...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {ToastComponent}
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
      `}</style>

        {/* ACTIVE PACKAGE STATUS */}
        {active && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 22, padding: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', filter: 'blur(40px)', opacity: 0.2, background: PACKAGE_STYLES[active.id]?.glow || '#a78bfa' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, position: 'relative' }}>
              <div style={{ width: 50, height: 50, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: PACKAGE_STYLES[active.id]?.bg || 'rgba(167,139,250,0.12)', border: `1px solid ${PACKAGE_STYLES[active.id]?.ring || 'rgba(167,139,250,0.3)'}`, flexShrink: 0 }}>
                {ICONS[active.id]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: SG, fontWeight: 900, fontSize: 17 }}>{active.name}</span>
                  <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: 1, padding: '2px 8px', borderRadius: 6, background: PACKAGE_STYLES[active.id]?.bg || 'rgba(167,139,250,0.12)', color: PACKAGE_STYLES[active.id]?.color || '#a78bfa', border: `1px solid ${PACKAGE_STYLES[active.id]?.ring || 'rgba(167,139,250,0.3)'}` }}>
                    {TIER_LABELS[active.id]}
                  </span>
                  <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                    ACTIVE
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
                  Daily Claim: <span style={{ color: '#22c55e', fontWeight: 700 }}>{(0.05 * packageBoost).toFixed(2)} ONC/day</span>
                </div>
              </div>
              <div style={{ flexShrink: 0, position: 'relative' }}>
                <svg width="72" height="72" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                  <circle cx="40" cy="40" r="34" fill="none" strokeWidth="5" strokeLinecap="round" strokeDasharray={CIRCUM} strokeDashoffset={CIRCUM - (gaugePct / 100) * CIRCUM} transform="rotate(-90 40 40)" style={{ stroke: gaugeColor, transition: '0.8s' }} />
                  <text x="40" y="37" textAnchor="middle" fontSize="15" fontWeight="900" fontFamily={SG} fill="white">{Math.round(gaugePct)}%</text>
                  <text x="40" y="50" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.3)" fontWeight="600">Used</text>
                </svg>
              </div>
            </div>
            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, position: 'relative' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Boost</div>
                <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 16, color: '#22c55e', marginTop: 2 }}>{packageBoost}x</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Earned</div>
                <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 16, color: '#fbbf24', marginTop: 2 }}>{formatUSD(packageUsage)}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Cap</div>
                <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 16, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{formatUSD(packageCap)}</div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="rgba(167,139,250,0.3)" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ fontFamily: SG, fontWeight: 800, fontSize: 16 }}>Choose Your Package</span>
          <div onClick={() => setShowRules(true)} style={{ marginLeft: 'auto', width: 24, height: 24, borderRadius: '50%', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="13" height="13" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: -8, marginBottom: 4 }}>Higher packages unlock faster mining & bigger commission caps</div>

        {/* PACKAGE CARDS - FULL WIDTH STACKED */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PACKAGES.map((p, idx) => {
            const isPurchased = purchasedPackages.includes(p.id);
            const isActive = activePkg === p.id;
            const isSelected = selectedPkg === p.id && !isPurchased;
            const ps = PACKAGE_STYLES[p.id] || PACKAGE_STYLES.starter;
            const dailyClaim = (0.05 * p.boost).toFixed(2);
            return (
              <button
                key={p.id}
                onClick={() => !isPurchased && setSelectedPkg(p.id)}
                disabled={isPurchased}
                style={{
                  border: `1px solid ${isActive ? ps.color : isSelected ? ps.ring : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 20,
                  padding: 0,
                  cursor: isPurchased ? 'default' : 'pointer',
                  transition: 'all 0.3s',
                  position: 'relative',
                  overflow: 'hidden',
                  opacity: isPurchased && !isActive ? 0.4 : 1,
                  background: isSelected
                    ? `linear-gradient(135deg, ${ps.bg}, rgba(255,255,255,0.04))`
                    : isActive
                      ? `linear-gradient(135deg, ${ps.bg}, rgba(255,255,255,0.02))`
                      : 'rgba(255,255,255,0.03)',
                  color: 'white',
                  fontFamily: INTER,
                  textAlign: 'left',
                }}
              >
                {/* Background glow */}
                <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', filter: 'blur(35px)', opacity: isSelected || isActive ? 0.3 : 0.1, background: ps.glow, pointerEvents: 'none', transition: '0.4s' }} />

                <div style={{ padding: '18px 18px 16px', position: 'relative' }}>
                  {/* Top row: icon + name + badge + price */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    {/* Icon with ring */}
                    <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: ps.bg, border: `1px solid ${ps.ring}`, position: 'relative' }}>
                      {ICONS[p.id]}
                      {isActive && (
                        <div style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%', background: '#22c55e', border: '2px solid #03040a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: SG, fontWeight: 900, fontSize: 16 }}>{p.name}</span>
                        <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: 1, padding: '2px 7px', borderRadius: 5, background: ps.bg, color: ps.color, border: `1px solid ${ps.ring}` }}>
                          {TIER_LABELS[p.id]}
                        </span>
                        {isActive && (
                          <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: 0.5, padding: '2px 7px', borderRadius: 5, background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>ACTIVE</span>
                        )}
                        {isPurchased && !isActive && (
                          <span style={{ fontSize: 7, fontWeight: 800, padding: '2px 7px', borderRadius: 5, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>USED</span>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
                        Daily: <span style={{ color: '#22c55e', fontWeight: 700 }}>{dailyClaim} ONC</span>
                        <span style={{ margin: '0 4px', opacity: 0.3 }}>|</span>
                        Cap: <span style={{ color: 'rgba(255,255,255,0.5)' }}>{formatUSD(p.cap)}</span>
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      {isPurchased ? (
                        <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 18, color: 'rgba(255,255,255,0.2)' }}>$--</div>
                      ) : (
                        <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 20, background: ps.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>${p.price}</div>
                      )}
                    </div>
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '8px 6px', textAlign: 'center' }}>
                      <div style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Mining</div>
                      <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 14, color: ps.color, marginTop: 1 }}>
                        {p.boost}<span style={{ fontSize: 10, opacity: 0.6 }}>x</span>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '8px 6px', textAlign: 'center' }}>
                      <div style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Daily</div>
                      <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 14, color: '#22c55e', marginTop: 1 }}>
                        {dailyClaim} ONC
                      </div>
                    </div>
                  </div>

                  {/* ROI Section */}
                  {ROI_DATA[p.id] && (
                    <div style={{ marginTop: 10, background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.08)', borderRadius: 10, padding: '8px 10px', position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <div style={{ fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(34,197,94,0.12)', color: '#22c55e', letterSpacing: 0.5 }}>ROI</div>
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#22c55e' }}>Daily 1% ROI</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, (ROI_DATA[p.id].days / 365) * 100)}%`, background: 'linear-gradient(90deg, #22c55e, #4ade80)', borderRadius: 20 }} />
                        </div>
                        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontWeight: 700, whiteSpace: 'nowrap' }}>{ROI_DATA[p.id].days}d</span>
                      </div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                        1% daily for {ROI_DATA[p.id].days} days = <span style={{ color: '#22c55e', fontWeight: 800 }}>${ROI_DATA[p.id].totalRoi.toFixed(2)}</span> total
                      </div>
                    </div>
                  )}
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div style={{ height: 3, background: ps.gradient, borderRadius: '0 0 20px 20px' }} />
                )}
              </button>
            );
          })}
        </div>

        {/* UPGRADE CREDIT INFO */}
        {upgradeCredit > 0 && (
          <div style={{ background: 'linear-gradient(135deg,rgba(34,197,94,0.08),rgba(34,197,94,0.03))', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e' }}>Upgrade Credit: -{formatUSD(upgradeCredit)}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>You get 70% back because usage &lt; 5%</div>
            </div>
          </div>
        )}

        {/* BUY BUTTON */}
        <button
          onClick={purchase}
          disabled={!selected || purchasing || walletBalance < finalPrice}
          style={{
            width: '100%', padding: 18, borderRadius: 18,
            background: !selected || purchasing || walletBalance < finalPrice ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg,#a78bfa,#60a5fa)',
            color: !selected || purchasing || walletBalance < finalPrice ? '#444' : '#000',
            fontWeight: 900, fontSize: 15, cursor: !selected || purchasing || walletBalance < finalPrice ? 'not-allowed' : 'pointer',
            transition: '0.3s', fontFamily: SG, letterSpacing: 0.5,
            border: !selected || purchasing || walletBalance < finalPrice ? '1px solid rgba(255,255,255,0.06)' : 'none',
          }}
        >
          {purchasing ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
              Processing...
            </span>
          ) : buyLabel}
        </button>

      {/* UPGRADE RULES MODAL */}
      {showRules && (
        <div onClick={() => setShowRules(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 5000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 0, backdropFilter: 'blur(8px)' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#0b0d18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px 24px 0 0', padding: '24px 20px 32px', maxWidth: 480, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            {/* Handle bar */}
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(167,139,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#a78bfa" strokeWidth="1.5"/><line x1="12" y1="16" x2="12" y2="12" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="8" x2="12.01" y2="8" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 18 }}>Package Rules</div>
              <div onClick={() => setShowRules(false)} style={{ marginLeft: 'auto', width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { num: '1', color: '#a78bfa', title: 'One Package at a Time', desc: 'Each package can only be purchased once. To get more benefits, upgrade to a higher tier.' },
                { num: '2', color: '#60a5fa', title: 'Cap Stacking', desc: 'When you upgrade, your new package cap is added to the previous cap. More upgrades = bigger lifetime earning potential.' },
                { num: '3', color: '#22c55e', title: '70% Upgrade Credit', desc: 'If usage is less than 5%, you get 70% of current package price as credit toward the upgrade.' },
                { num: '4', color: '#f59e0b', title: 'Mining Boost Replaces', desc: 'New package boost replaces the old one. Higher tier = more ONC per day.' },
                { num: '5', color: '#ec4899', title: 'Referral Commissions', desc: 'When your team buys packages, you earn 10% (L1), 5% (L2), 3% (L3) commission on the price.' },
              ].map(rule => (
                <div key={rule.num} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${rule.color}15`, border: `1px solid ${rule.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: SG, fontWeight: 900, fontSize: 12, color: rule.color }}>{rule.num}</div>
                  <div>
                    <div style={{ fontFamily: SG, fontWeight: 800, fontSize: 13, color: rule.color, marginBottom: 3 }}>{rule.title}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{rule.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setShowRules(false)} style={{ marginTop: 20, width: '100%', padding: 14, border: 'none', borderRadius: 14, background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', color: '#000', fontWeight: 900, fontSize: 13, cursor: 'pointer', fontFamily: SG }}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
