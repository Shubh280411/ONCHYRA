'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

interface AirdropStatus {
  balance: number;
  totalReceived: number;
  allocation: { signup: number; l1: number; l2: number; l3: number };
  tokenInfo: { maxSupply: number; distributed: number; remaining: number };
}

export default function OnxAirdropPage() {
  const { uid } = useAuth();
  const [status, setStatus] = useState<AirdropStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!uid) return;
    try {
      const res = await fetch(`/api/onx/status?uid=${uid}`);
      if (res.ok) setStatus(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    loadData();
  }, [uid, loadData]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80 }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.05)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 600, marginTop: 12 }}>Loading...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const ti = status?.tokenInfo;
  const distPct = ti ? Math.min(100, (ti.distributed / ti.maxSupply) * 100) : 0;
  const alloc = status?.allocation;
  const totalAlloc = (alloc?.signup || 0) + (alloc?.l1 || 0) + (alloc?.l2 || 0) + (alloc?.l3 || 0);

  return (
    <div style={{ fontFamily: INTER }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header */}
        <div>
          <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 22, background: 'linear-gradient(135deg,#8b5cf6,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ONX Airdrop</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>ONCHYRA X Token &middot; Polygon Network</div>
        </div>

        {/* Special Airdrop Banner */}
        <div style={{ background: 'linear-gradient(135deg,rgba(251,191,36,0.08),rgba(239,68,68,0.06),rgba(139,92,246,0.06))', border: '1px solid rgba(251,191,36,0.18)', borderRadius: 18, padding: '18px 18px', position: 'relative', overflow: 'hidden', animation: 'fadeUp 0.3s ease' }}>
          <div style={{ position: 'absolute', top: 12, right: 14, fontSize: 36, opacity: 0.08 }}>&#x1F680;</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 8px rgba(251,191,36,0.4)' }} />
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: '#fbbf24', textTransform: 'uppercase' as const }}>Special Airdrop</span>
          </div>
          <div style={{ fontFamily: SG, fontWeight: 800, fontSize: 14, color: '#fff', lineHeight: 1.5, marginBottom: 10 }}>
            This is a <span style={{ color: '#fbbf24' }}>limited-time special airdrop</span> with a max supply of just <span style={{ color: '#8b5cf6' }}>10,000 ONX</span>.
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 12 }}>
            Build your team fast and earn ONX tokens. Once we hit <span style={{ color: '#22c55e', fontWeight: 700 }}>2,000 members</span>, we will add liquidity and ONX will be tradeable on-chain.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)', fontSize: 10, fontWeight: 700, color: '#a78bfa' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Max Supply: 10,000 ONX
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.12)', fontSize: 10, fontWeight: 700, color: '#22c55e' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Liquidity at 2K Members
            </div>
          </div>
        </div>

        {/* Token Info Card */}
        <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(96,165,250,0.06))', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 20, padding: '24px 20px', position: 'relative', overflow: 'hidden', animation: 'fadeUp 0.4s ease' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, position: 'relative' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(96,165,250,0.15))', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              <img src="/ONX-logo.png" alt="ONX" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 22 }}>ONX</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>ONCHYRA X &middot; Polygon Network</div>
            </div>
          </div>

          {/* Your Balance */}
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 14, padding: '16px 18px', marginBottom: 16 }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase' as const }}>Your Balance</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
              <span style={{ fontFamily: SG, fontWeight: 900, fontSize: 28, color: '#8b5cf6' }}>{(status?.balance || 0).toFixed(2)}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(139,92,246,0.5)' }}>ONX</span>
            </div>
          </div>

          {/* Supply Visualization */}
          {ti && (
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>Supply Distribution</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{distPct.toFixed(1)}%</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', height: 10, borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${distPct}%`, background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)', borderRadius: 20, transition: '0.8s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>Distributed: {ti.distributed.toLocaleString()}</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>Max: {ti.maxSupply.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Your Allocation */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '18px 18px 14px', animation: 'fadeUp 0.5s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const }}>Your Allocation</span>
            </div>
            <span style={{ fontFamily: SG, fontWeight: 900, fontSize: 14, color: '#8b5cf6' }}>{totalAlloc.toFixed(2)} ONX</span>
          </div>

          {[
            { label: 'Signup Bonus', value: alloc?.signup || 0, color: '#22c55e', bg: 'rgba(34,197,94,0.1)', desc: 'Instant bonus for joining' },
            { label: 'L1 Direct', value: alloc?.l1 || 0, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', desc: '5 ONX per direct referral' },
            { label: 'L2 Indirect', value: alloc?.l2 || 0, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', desc: '3 ONX per 2nd level referral' },
            { label: 'L3 Tier', value: alloc?.l3 || 0, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', desc: '2 ONX per 3rd level referral' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: item.bg, border: `1px solid ${item.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: SG, fontWeight: 700, fontSize: 12, color: item.color }}>{item.label}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{item.desc}</div>
              </div>
              <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 14, color: item.color }}>{item.value.toFixed(2)} <span style={{ fontSize: 9, opacity: 0.5 }}>ONX</span></div>
            </div>
          ))}
        </div>

        {/* Airdrop Rates */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '18px 18px 14px', animation: 'fadeUp 0.6s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const }}>Airdrop Rates</span>
          </div>

          {[
            { level: 'Signup', color: '#22c55e', amount: '10.00 ONX', desc: 'Instant bonus for joining ONCHYRA' },
            { level: 'L1 Direct', color: '#a78bfa', amount: '5.00 ONX', desc: 'Per direct referral in your network' },
            { level: 'L2 Indirect', color: '#60a5fa', amount: '3.00 ONX', desc: 'Per 2nd level referral in your tree' },
            { level: 'L3 Tier', color: '#fbbf24', amount: '2.00 ONX', desc: 'Per 3rd level referral in your network' },
          ].map((tier, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${tier.color}15`, border: `1px solid ${tier.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: SG, fontWeight: 900, fontSize: 10, color: tier.color }}>
                {tier.level}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: SG, fontWeight: 700, fontSize: 12, color: tier.color }}>{tier.level}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{tier.desc}</div>
              </div>
              <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 12, color: tier.color }}>{tier.amount}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
