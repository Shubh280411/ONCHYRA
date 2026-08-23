'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import type React from 'react';
import { detectApiUrl, formatUSD } from '@/lib/utils';
import Loading from '@/components/ui/Loading';

const PACKAGES = [
  { id: 'starter', name: 'Starter', price: 5, boost: 4, cap: 50, glow: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  { id: 'builder', name: 'Builder', price: 10, boost: 8, cap: 100, glow: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  { id: 'pioneer', name: 'Pioneer', price: 25, boost: 15, cap: 250, glow: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  { id: 'elite', name: 'Elite', price: 50, boost: 30, cap: 500, glow: '#ec4899', bg: 'rgba(236,72,153,0.15)' },
  { id: 'titan', name: 'Titan', price: 100, boost: 60, cap: 1000, glow: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  { id: 'dominion', name: 'Dominion', price: 250, boost: 120, cap: 2500, glow: '#f43f5e', bg: 'rgba(244,63,94,0.15)' },
  { id: 'legacy', name: 'Legacy', price: 500, boost: 300, cap: 5000, glow: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
];

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
    if (walletBalance < finalPrice) return `Insufficient balance (${formatUSD(finalPrice)} needed)`;
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

  if (loading) return <Loading text="Loading packages..." />;

  return (
    <div className="min-h-screen px-4 py-5 max-w-md mx-auto flex flex-col gap-3.5">
      {ToastComponent}

      {/* Header */}
      <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3.5">
        <Link href="/dashboard" className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06] text-white shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
        </Link>
        <span className="font-[family-name:var(--font-space-grotesk)] font-black text-lg bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent flex-1">
          ONCHYRA
        </span>
        <span className="text-[11px] font-bold bg-purple-500/10 border border-purple-500/15 px-3.5 py-1.5 rounded-full whitespace-nowrap">
          Wallet <span className="font-[family-name:var(--font-space-grotesk)] text-[var(--primary)]">{formatUSD(walletBalance)}</span>
        </span>
      </div>

      {/* Title */}
      <div className="flex items-center gap-2">
        <h1 className="font-[family-name:var(--font-space-grotesk)] font-extrabold text-xl">Mining Packages</h1>
        <div className="w-6 h-6 rounded-full bg-purple-500/15 border border-purple-500/25 flex items-center justify-center cursor-pointer">
          <svg width="14" height="14" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
        </div>
      </div>
      <p className="text-white/40 text-xs -mt-2">Activate a package to boost your mining rate</p>

      {/* Active Package Card */}
      {active && (
        <div className="flex items-center gap-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center gap-3.5 flex-1">
            <div className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0" style={{ background: active.bg }}>
              {ICONS[active.id]}
            </div>
            <div>
              <div className="font-[family-name:var(--font-space-grotesk)] font-black text-sm">{active.name}</div>
              <div className="text-[11px] text-green-400 font-bold flex items-center gap-1 mt-0.5">
                <svg width="12" height="12" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><polyline points="18 2 22 6 18 10" /><path d="M22 6h-8a6 6 0 0 0-6 6v10" /></svg>
                {packageBoost}x
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center shrink-0">
            <svg width="76" height="76" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" fill="none" strokeWidth="6" strokeLinecap="round" strokeDasharray={CIRCUM} strokeDashoffset={CIRCUM - (gaugePct / 100) * CIRCUM} transform="rotate(-90 40 40)" style={{ stroke: gaugeColor, transition: '0.8s' }} />
              <text x="40" y="36" textAnchor="middle" fontSize="16" fontWeight="900" fontFamily="'Space Grotesk'" fill="white">{Math.round(gaugePct)}%</text>
              <text x="40" y="50" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.25)">Used</text>
            </svg>
            <div className="text-[9px] text-white/40 -mt-1 text-center">{formatUSD(packageUsage)} / {formatUSD(packageCap)}</div>
          </div>
        </div>
      )}

      {/* Package Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {PACKAGES.map(p => {
          const isPurchased = purchasedPackages.includes(p.id);
          const isSelected = selectedPkg === p.id && !isPurchased;
          return (
            <button
              key={p.id}
              onClick={() => !isPurchased && setSelectedPkg(p.id)}
              disabled={isPurchased}
              className={`relative rounded-2xl p-4 text-left transition-all border ${
                isPurchased ? 'opacity-45 border-white/[0.06] bg-white/[0.02] cursor-not-allowed' :
                isSelected ? 'border-[var(--primary)] bg-purple-500/[0.06]' :
                'border-white/[0.06] bg-white/[0.03] active:scale-[0.97]'
              }`}
            >
              {isPurchased && (
                <div className="absolute top-2.5 right-2.5 text-[7px] font-extrabold px-2 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/20 uppercase">DONE</div>
              )}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5" style={{ background: p.bg }}>
                {ICONS[p.id]}
              </div>
              <div className="font-[family-name:var(--font-space-grotesk)] font-black text-sm">{p.name}</div>
              <div className="font-[family-name:var(--font-space-grotesk)] font-black text-xl mt-1 bg-gradient-to-r from-white to-purple-400/50 bg-clip-text text-transparent">
                {formatUSD(p.price)}
              </div>
              <div className="text-[10px] font-bold text-green-400 bg-green-500/[0.08] px-2.5 py-1 rounded-full mt-1.5 inline-block">{p.boost}x Mining</div>
              <div className="text-[9px] text-white/25 mt-1.5">{formatUSD(p.cap)} max</div>
            </button>
          );
        })}
      </div>

      {/* Info Card */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex justify-between py-2.5 border-b border-white/[0.03] text-xs last:border-b-0">
          <span className="text-white/40">Current Package</span>
          <span className="font-bold">{active?.name || 'None'}</span>
        </div>
        <div className="flex justify-between py-2.5 border-b border-white/[0.03] text-xs last:border-b-0">
          <span className="text-white/40">Mining Boost</span>
          <span className="font-bold text-green-400">{packageBoost}x</span>
        </div>
        <div className="flex justify-between py-2.5 border-b border-white/[0.03] text-xs last:border-b-0">
          <span className="text-white/40">Package Usage</span>
          <span className="font-bold">{formatUSD(packageUsage)} / {formatUSD(packageCap)}</span>
        </div>
        <div className="flex justify-between py-2.5 text-xs last:border-b-0">
          <span className="text-white/40">Upgrade Credit</span>
          <span className="font-bold">{formatUSD(upgradeCredit)}</span>
        </div>
      </div>

      {/* Buy Button */}
      <button
        onClick={purchase}
        disabled={!selected || purchasing || walletBalance < finalPrice}
        className="w-full py-4.5 rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-black font-[family-name:var(--font-space-grotesk)] font-black text-sm transition-all hover:opacity-90 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {purchasing ? 'Processing...' : buyLabel}
      </button>
    </div>
  );
}
