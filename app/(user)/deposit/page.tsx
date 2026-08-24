'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl, formatUSD } from '@/lib/utils';
import type { Deposit } from '@/types';
import Loading from '@/components/ui/Loading';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

function fmtDate(ts: number) {
  if (!ts) return '-';
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function DepositPage() {
  const { uid } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const apiUrl = detectApiUrl();

  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalNetwork, setModalNetwork] = useState('');
  const [depositAddress, setDepositAddress] = useState('');
  const [depositIndex, setDepositIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!uid) return;
    loadData();
  }, [uid]);

  async function loadData() {
    setLoading(true);
    try {
      const [userRes, depRes] = await Promise.all([
        fetch(`${apiUrl}/api/user/${uid}`),
        fetch(`${apiUrl}/api/deposits/${uid}`),
      ]);
      if (userRes.ok) {
        const d = await userRes.json();
        setBalance(Number(d.walletBalance) || 0);
      }
      if (depRes.ok) {
        const deps = await depRes.json();
        setHistory((deps || []).filter((d: Deposit) => (Number(d.amount) || 0) > 0));
      }
    } catch {}
    setLoading(false);
  }

  async function openDeposit(network: string) {
    setModalNetwork(network);
    setModalOpen(true);
    setDepositAddress('');
    setGenerating(true);
    try {
      const res = await fetch(`${apiUrl}/api/deposit/create-wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, network }),
      });
      const data = await res.json();
      if (!data.address) throw new Error(data.error || 'Failed');
      setDepositAddress(data.address);
      setDepositIndex(data.index || 0);
    } catch {
      showToast('Deposit system temporarily unavailable', 'error');
      setModalOpen(false);
    }
    setGenerating(false);
  }

  function showDetail(dep: Deposit) {
    setSelectedDeposit(dep);
    setDetailOpen(true);
  }

  if (loading) return <Loading text="Loading deposit info..." />;

  const isBsc = modalNetwork === 'BEP20';

  return (
    <div style={{ fontFamily: INTER, background: '#03040a', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px' }}>
      {ToastComponent}

      <style>{`
        @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
        @keyframes slideUp{from{transform:translateY(40px);opacity:0;}to{transform:translateY(0);opacity:1;}}
        @keyframes pulseRing{0%{transform:scale(1);opacity:0.4;}50%{transform:scale(1.15);opacity:0.1;}100%{transform:scale(1);opacity:0.4;}}
      `}</style>

      {/* phone-frame */}
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 22, padding: '14px 16px' }}>
          <Link href="/dashboard" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, cursor: 'pointer', color: 'white', textDecoration: 'none', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          </Link>
          <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 18, background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', flex: 1 }}>ONCHYRA</div>
        </div>

        {/* balance hero */}
        <div style={{ background: 'linear-gradient(135deg,rgba(167,139,250,0.1),rgba(96,165,250,0.05))', border: '1px solid rgba(167,139,250,0.12)', borderRadius: 24, padding: '24px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(167,139,250,0.08)', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 2, color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>Available Balance</div>
          <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 42, background: 'linear-gradient(135deg,#fff 20%,rgba(167,139,250,0.6))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1 }}>{formatUSD(balance)}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>Deposit to start mining</div>
        </div>

        {/* section title */}
        <div style={{ fontFamily: SG, fontWeight: 800, fontSize: 22, margin: '4px 0 2px' }}>
          <svg width="22" height="22" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24" style={{ verticalAlign: '-4px', marginRight: 6 }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/><polyline points="16 3 21 3 21 8"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Deposit Funds
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Choose a network to deposit</div>

        {/* BEP20 Card */}
        <div onClick={() => openDeposit('BEP20')} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 20, cursor: 'pointer', transition: '0.25s' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(255,255,255,0.04)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#f0b90b"><path d="M12 2L6 8l6 6 6-6-6-6zm0 14l-6-6-6 6 6 6 6-6zm-6-8l6-6 6 6-6 6-6-6z" opacity="0.9"/><path d="M12 2l6 6-6 6-6-6 6-6z"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>USDT (BEP20)</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Binance Smart Chain</div>
          </div>
          <svg style={{ color: 'rgba(255,255,255,0.2)' }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>

        {/* Polygon Card */}
        <div onClick={() => openDeposit('Polygon')} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 20, cursor: 'pointer', transition: '0.25s' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(255,255,255,0.04)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#8247e5"><path d="M17.2 8.3l-4.5-2.6c-.5-.3-1.1-.3-1.6 0L6.6 8.3c-.5.3-.8.8-.8 1.4v5.2c0 .5.3 1 .8 1.4l4.5 2.6c.5.3 1.1.3 1.6 0l4.5-2.6c.5-.3.8-.8.8-1.4V9.7c0-.6-.3-1.1-.8-1.4zM12 15.5c-1.9 0-3.5-1.6-3.5-3.5S10.1 8.5 12 8.5s3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>POL (Polygon)</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Polygon Network</div>
          </div>
          <svg style={{ color: 'rgba(255,255,255,0.2)' }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>

        {/* Deposit Modal */}
        <div onClick={() => setModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: modalOpen ? 'flex' : 'none', alignItems: 'flex-end', justifyContent: 'center', padding: 20, animation: 'fadeIn 0.25s' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#03040a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 32, padding: '28px 24px', maxWidth: 440, width: '100%', maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp 0.35s', textAlign: 'center' }}>
            {generating ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 20 }}>
                <div style={{ width: 40, height: 40, border: '3px solid rgba(167,139,250,0.1)', borderTop: '3px solid #a78bfa', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Generating address...</div>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            ) : depositAddress ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ background: 'white', borderRadius: 16, padding: 12, display: 'inline-block', marginBottom: 12 }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(depositAddress)}`} alt="QR" style={{ width: 200, height: 200, display: 'block' }} />
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '6px 16px', borderRadius: 100, marginBottom: 12, background: isBsc ? 'rgba(240,185,11,0.1)' : 'rgba(130,71,229,0.1)', color: isBsc ? '#f0b90b' : '#8247e5', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: 1 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={isBsc ? '#f0b90b' : '#8247e5'}><circle cx="12" cy="12" r="10"/></svg>
                  {isBsc ? 'USDT (BEP20)' : 'POL (Polygon)'}
                </div>
                <div style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600, color: 'rgba(255,255,255,0.6)', wordBreak: 'break-all' as const, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, margin: '12px 0', width: '100%' }}>{depositAddress}</div>
                <button onClick={() => { navigator.clipboard.writeText(depositAddress); showToast('Address copied!'); }} style={{ padding: '10px 24px', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 12, cursor: 'pointer', background: isBsc ? '#f0b90b' : '#8247e5', color: isBsc ? '#000' : '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy Address
                </button>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 8 }}>#{depositIndex} — {modalNetwork}</div>
                <div style={{ fontSize: 10, color: 'rgba(239,68,68,0.6)', padding: 10, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.08)', borderRadius: 10, marginTop: 10, lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  Send only {isBsc ? 'USDT (BEP20)' : 'POL (Polygon)'}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 12 }}>Waiting for deposit... (typically 1-5 min)</div>
              </div>
            ) : null}
            <button onClick={() => setModalOpen(false)} style={{ marginTop: 16, padding: 10, border: 'none', background: 'rgba(255,255,255,0.04)', borderRadius: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: 11, cursor: 'pointer', width: '100%' }}>Close</button>
          </div>
        </div>

        {/* Success Modal */}
        <div onClick={() => setSuccessOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: successOpen ? 'flex' : 'none', alignItems: 'flex-end', justifyContent: 'center', padding: 20, animation: 'fadeIn 0.25s' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#03040a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 32, padding: '28px 24px', maxWidth: 440, width: '100%', maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp 0.35s', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 16px' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', animation: 'pulseRing 1.5s infinite' }} />
              <div style={{ position: 'absolute', inset: 4, borderRadius: '50%', background: 'rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="36" height="36" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4, fontFamily: SG }}>Deposit Successful</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>{successMsg}</div>
            <button onClick={() => setSuccessOpen(false)} style={{ padding: 10, border: 'none', background: 'rgba(255,255,255,0.04)', borderRadius: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: 11, cursor: 'pointer', width: '100%' }}>Done</button>
          </div>
        </div>

        {/* Detail Modal */}
        <div onClick={() => setDetailOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: detailOpen ? 'flex' : 'none', alignItems: 'flex-end', justifyContent: 'center', padding: 20, animation: 'fadeIn 0.25s' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#03040a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 32, padding: '28px 24px', maxWidth: 440, width: '100%', maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp 0.35s', textAlign: 'left' }}>
            <div style={{ fontSize: 16, fontWeight: 900, fontFamily: SG, marginBottom: 16 }}>Deposit Details</div>
            {selectedDeposit && (() => {
              const isPol = selectedDeposit.network === 'Polygon';
              const symbol = isPol ? 'POL' : 'USDT';
              const rawAmt = isPol ? (Number(selectedDeposit.polAmount) || 0) : (Number(selectedDeposit.amount) || 0);
              const usdAmt = Number(selectedDeposit.amount) || 0;
              const polPrice = Number(selectedDeposit.polPrice) || 0;
              const txHash = selectedDeposit.txHash || '-';
              const date = fmtDate(selectedDeposit.createdAt);
              const networkColor = isPol ? '#8247e5' : '#f0b90b';
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${networkColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={networkColor}><circle cx="12" cy="12" r="10"/></svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{rawAmt} {symbol}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}><span style={{ color: networkColor }}>{isPol ? 'Polygon' : 'BEP20'}</span></div>
                    </div>
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: '#22c55e' }}>${usdAmt.toFixed(2)}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>USD Value</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, lineHeight: 2, color: 'rgba(255,255,255,0.5)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span style={{ color: 'rgba(255,255,255,0.3)' }}>Date</span><span style={{ color: 'white' }}>{date}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span style={{ color: 'rgba(255,255,255,0.3)' }}>Amount</span><span style={{ color: 'white' }}>{rawAmt} {symbol}</span></div>
                    {isPol && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span style={{ color: 'rgba(255,255,255,0.3)' }}>POL Price</span><span style={{ color: 'white' }}>${polPrice.toFixed(4)}</span></div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span style={{ color: 'rgba(255,255,255,0.3)' }}>USD Value</span><span style={{ color: '#22c55e', fontWeight: 700 }}>${usdAmt.toFixed(2)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', wordBreak: 'break-all' as const }}><span style={{ color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' as const, marginRight: 8 }}>TX Hash</span><span style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace', fontSize: 10, textAlign: 'right' }}>{txHash}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span style={{ color: 'rgba(255,255,255,0.3)' }}>Status</span><span style={{ color: selectedDeposit.status === 'completed' ? '#22c55e' : '#fbbf24', fontWeight: 700 }}>{selectedDeposit.status || 'pending'}</span></div>
                  </div>
                </>
              );
            })()}
            <button onClick={() => setDetailOpen(false)} style={{ marginTop: 16, padding: 10, border: 'none', background: 'rgba(255,255,255,0.04)', borderRadius: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: 11, cursor: 'pointer', width: '100%' }}>Close</button>
          </div>
        </div>

        {/* Recent Deposits */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 22, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, color: 'rgba(255,255,255,0.3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Recent Deposits
          </div>
          {history.length === 0 ? (
            <div style={{ padding: 12, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>No deposits yet</div>
          ) : (
            history.map(dep => {
              const isPol = dep.network === 'Polygon';
              const rawAmt = isPol ? (Number(dep.polAmount) || 0) : (Number(dep.amount) || 0);
              const symbol = isPol ? 'POL' : 'USDT';
              const networkColor = isPol ? '#8247e5' : '#f0b90b';
              const label = isPol
                ? <>{rawAmt} POL <span style={{ opacity: 0.4 }}>&rarr; ${(Number(dep.amount) || 0).toFixed(2)}</span></>
                : <>{formatUSD(Number(dep.amount) || 0)} USDT</>;
              return (
                <div key={dep.id} onClick={() => showDetail(dep)} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 12, marginBottom: 6, fontSize: 11, alignItems: 'center', cursor: 'pointer' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={networkColor}><circle cx="12" cy="12" r="10"/></svg>
                    {label}
                    <span style={{ opacity: 0.3 }}>{fmtDate(dep.createdAt)}</span>
                  </span>
                  <span style={{ color: dep.status === 'completed' ? '#22c55e' : '#fbbf24', fontWeight: 700 }}>{dep.status || 'pending'}</span>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
