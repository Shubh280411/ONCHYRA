'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl, formatUSD } from '@/lib/utils';
import { PACKAGES } from '@/types';
import type React from 'react';

const PACKAGE_COLORS: Record<string, { glow: string; bg: string; color: string }> = {
  starter: { glow: '#a78bfa', bg: 'rgba(167,139,250,0.15)', color: '#a78bfa' },
  builder: { glow: '#60a5fa', bg: 'rgba(96,165,250,0.15)', color: '#60a5fa' },
  pioneer: { glow: '#f59e0b', bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  elite: { glow: '#ec4899', bg: 'rgba(236,72,153,0.15)', color: '#ec4899' },
  titan: { glow: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6' },
  dominion: { glow: '#f43f5e', bg: 'rgba(244,63,94,0.15)', color: '#f43f5e' },
  legacy: { glow: '#fbbf24', bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
};

const ICONS: Record<string, React.JSX.Element> = {
  starter: <svg width="22" height="22" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  builder: <svg width="22" height="22" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
  pioneer: <svg width="22" height="22" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  elite: <svg width="22" height="22" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  titan: <svg width="22" height="22" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  dominion: <svg width="22" height="22" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>,
  legacy: <svg width="22" height="22" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" /></svg>,
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
    if (walletBalance < finalPrice) return `Insufficient wallet balance (${formatUSD(finalPrice)} needed)`;
    if (upgradeCredit > 0) return `Activate ${formatUSD(selected.price)} (Credit: ${formatUSD(upgradeCredit)})`;
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
      showToast(`${selected.name} activated! ${selected.boost}x mining boost`);
      setSelectedPkg(null);
      loadData();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Purchase failed', 'error');
    }
    setPurchasing(false);
  }

  if (loading) {
    return (
      <div style={{ fontFamily: "'Inter',sans-serif", background: '#03040a', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px', backgroundImage: 'radial-gradient(ellipse at 50% 0%,rgba(167,139,250,0.06) 0%,transparent 60%)' }}>
        <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', paddingTop: 60 }}>
          <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.05)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Loading packages...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: '#03040a', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px', backgroundImage: 'radial-gradient(ellipse at 50% 0%,rgba(167,139,250,0.06) 0%,transparent 60%)' }}>
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {ToastComponent}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 22, padding: '14px 16px' }}>
          <Link href="/dashboard" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, cursor: 'pointer', color: 'white', textDecoration: 'none', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
          </Link>
          <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 900, fontSize: 18, background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', flex: 1 }}>
            ONCHYRA
          </span>
          <div style={{ fontSize: 11, fontWeight: 700, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.15)', padding: '6px 14px', borderRadius: 100, whiteSpace: 'nowrap' }}>
            Wallet <span style={{ fontFamily: "'Space Grotesk'", color: '#a78bfa' }}>{formatUSD(walletBalance)}</span>
          </div>
        </div>

        {/* Section title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 800, fontSize: 22, margin: '4px 0 2px' }}>Mining Packages</div>
          <div
            onClick={() => setShowRules(true)}
            style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <svg width="14" height="14" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Activate a package to boost your mining rate</div>

        {/* Active Package Card */}
        {active && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '16px 20px' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: PACKAGE_COLORS[active.id]?.bg || 'rgba(167,139,250,0.15)' }}>
                {ICONS[active.id]}
              </div>
              <div>
                <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 800, fontSize: 15 }}>{active.name}</div>
                <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <svg width="12" height="12" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><polyline points="18 2 22 6 18 10" /><path d="M22 6h-8a6 6 0 0 0-6 6v10" /></svg>
                  {packageBoost}x
                </div>
              </div>
            </div>
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg width="76" height="76" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                <circle cx="40" cy="40" r="34" fill="none" strokeWidth="6" strokeLinecap="round" strokeDasharray={CIRCUM} strokeDashoffset={CIRCUM - (gaugePct / 100) * CIRCUM} transform="rotate(-90 40 40)" style={{ stroke: gaugeColor, transition: '0.8s' }} />
                <text x="40" y="36" textAnchor="middle" fontSize="16" fontWeight="900" fontFamily="'Space Grotesk'" fill="white">{Math.round(gaugePct)}%</text>
                <text x="40" y="50" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.25)">Used</text>
              </svg>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: -2, textAlign: 'center' }}>{formatUSD(packageUsage)} / {formatUSD(packageCap)}</div>
            </div>
          </div>
        )}

        {/* Package Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {PACKAGES.map(p => {
            const isPurchased = purchasedPackages.includes(p.id);
            const isSelected = selectedPkg === p.id && !isPurchased;
            const pc = PACKAGE_COLORS[p.id] || PACKAGE_COLORS.starter;
            return (
              <button
                key={p.id}
                onClick={() => !isPurchased && setSelectedPkg(p.id)}
                disabled={isPurchased}
                style={{
                  border: `1px solid ${isSelected ? '#a78bfa' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 20, padding: '18px 16px 16px', cursor: isPurchased ? 'not-allowed' : 'pointer',
                  transition: '0.25s', position: 'relative', overflow: 'hidden', textAlign: 'left',
                  opacity: isPurchased ? 0.45 : 1,
                  background: isSelected ? 'rgba(167,139,250,0.06)' : 'rgba(255,255,255,0.04)',
                  color: 'white', fontFamily: "'Inter',sans-serif", fontSize: 12
                }}
              >
                <div style={{ position: 'absolute', top: -30, right: -30, width: 80, height: 80, borderRadius: '50%', filter: 'blur(30px)', opacity: isSelected ? 0.35 : 0.15, pointerEvents: 'none', transition: '0.4s', background: pc.glow }} />
                {isPurchased && (
                  <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 7, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, padding: '3px 8px', borderRadius: 6, background: 'rgba(34,197,94,0.15)', color: '#22c55e', zIndex: 2 }}>DONE</div>
                )}
                {!isPurchased && (
                  <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 7, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, padding: '3px 8px', borderRadius: 6, background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>{p.name[0]}</div>
                )}
                <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, background: pc.bg }}>
                  {ICONS[p.id]}
                </div>
                <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 800, fontSize: 15 }}>{p.name}</div>
                {isPurchased ? (
                  <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 900, fontSize: 22, marginTop: 4, color: 'rgba(255,255,255,0.3)' }}>Purchased</div>
                ) : (
                  <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 900, fontSize: 22, marginTop: 4, marginBottom: 4, background: 'linear-gradient(135deg,#fff 30%,rgba(167,139,250,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{formatUSD(p.price)}</div>
                )}
                <div style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.08)', padding: '3px 10px', borderRadius: 100, display: 'inline-block', marginTop: 4 }}>{p.boost}x Mining</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>{formatUSD(p.cap)} max</div>
              </button>
            );
          })}
        </div>

        {/* Info Card */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>Current Package</span>
            <span style={{ fontWeight: 700 }}>{active?.name || 'None'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>Mining Boost</span>
            <span style={{ fontWeight: 700, color: '#22c55e' }}>{packageBoost}x</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>Package Usage</span>
            <span style={{ fontWeight: 700 }}>{formatUSD(packageUsage)} / {formatUSD(packageCap)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>Upgrade Credit</span>
            <span style={{ fontWeight: 700 }}>{formatUSD(upgradeCredit)}</span>
          </div>
        </div>

        {/* Buy Button */}
        <button
          onClick={purchase}
          disabled={!selected || purchasing || walletBalance < finalPrice}
          style={{
            width: '100%', padding: 18, border: 'none', borderRadius: 16,
            background: !selected || purchasing || walletBalance < finalPrice ? '#1a1a1a' : 'linear-gradient(135deg,#a78bfa,#60a5fa)',
            color: !selected || purchasing || walletBalance < finalPrice ? '#444' : '#000',
            fontWeight: 900, fontSize: 15, cursor: !selected || purchasing || walletBalance < finalPrice ? 'not-allowed' : 'pointer',
            transition: '0.3s', fontFamily: "'Inter'"
          }}
        >
          {purchasing ? 'Processing...' : buyLabel}
        </button>
      </div>

      {/* Upgrade Rules Modal */}
      {showRules && (
        <div onClick={() => setShowRules(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#0d0f1a', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 20, padding: '24px 20px', maxWidth: 420, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 900, fontSize: 18, background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Upgrade Rules</div>
              <div onClick={() => setShowRules(false)} style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
              <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 14, padding: 14 }}>
                <div style={{ fontWeight: 800, color: '#a78bfa', marginBottom: 6 }}>1. One Package, One Time</div>
                <div>Each package can only be purchased <b style={{ color: 'white' }}>once</b>. You cannot buy the same package again. To get more benefits, you must upgrade to a higher package.</div>
              </div>
              <div style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: 14, padding: 14 }}>
                <div style={{ fontWeight: 800, color: '#60a5fa', marginBottom: 6 }}>2. Lifetime Cap Stacking</div>
                <div>When you upgrade, your new package cap is <b style={{ color: 'white' }}>added</b> to your previous cap. E.g., Builder ($100 cap) + Pioneer ($250 cap) = <b style={{ color: 'white' }}>$350 total cap</b>.</div>
              </div>
              <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 14, padding: 14 }}>
                <div style={{ fontWeight: 800, color: '#22c55e', marginBottom: 6 }}>3. Upgrade Credit (70% Back)</div>
                <div>If your current package usage is <b style={{ color: 'white' }}>less than 5%</b> of its cap, you get <b style={{ color: 'white' }}>70% of your current package price</b> as credit toward the upgrade.</div>
              </div>
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 14, padding: 14 }}>
                <div style={{ fontWeight: 800, color: '#f59e0b', marginBottom: 6 }}>4. Mining Boost Changes</div>
                <div>When you upgrade, your mining boost changes to the <b style={{ color: 'white' }}>new package&apos;s boost</b>. The boost is not added — it replaces the old one.</div>
              </div>
              <div style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.15)', borderRadius: 14, padding: 14 }}>
                <div style={{ fontWeight: 800, color: '#ec4899', marginBottom: 6 }}>5. Package Order</div>
                <div>Starter, Builder, Pioneer, Elite, Titan, Dominion, Legacy. You can only upgrade to a <b style={{ color: 'white' }}>higher</b> package.</div>
              </div>
            </div>
            <div onClick={() => setShowRules(false)} style={{ marginTop: 18, width: '100%', padding: 14, border: 'none', borderRadius: 14, background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', color: '#000', fontWeight: 800, fontSize: 13, cursor: 'pointer', textAlign: 'center' }}>Got it</div>
          </div>
        </div>
      )}
    </div>
  );
}
