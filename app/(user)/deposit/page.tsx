'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState(false);
  const [lastScan, setLastScan] = useState(0);
  const [polPrice, setPolPrice] = useState(0);
  const scanInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!uid) return;
    loadData();
    fetch(`${apiUrl}/api/price`).then(r => r.json()).then(d => { if (d.price) setPolPrice(d.price); }).catch(() => {});
  }, [uid]);

  useEffect(() => {
    if (modalOpen && depositAddress && !detected) {
      scanInterval.current = setInterval(() => triggerScan(), 30000);
      triggerScan();
    }
    return () => { if (scanInterval.current) clearInterval(scanInterval.current); };
  }, [modalOpen, depositAddress, detected]);

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
        setHistory((deps || []).map((d: Record<string, unknown>) => ({
          ...d,
          txHash: d.tx_hash || d.txHash || '',
          polAmount: Number(d.pol_amount || d.polAmount) || 0,
          polPrice: Number(d.pol_price || d.polPrice) || 0,
          createdAt: d.created_at || d.createdAt || 0,
        })).filter((d: Deposit) => (Number(d.amount) || 0) > 0));
      }
    } catch {}
    setLoading(false);
  }

  async function triggerScan() {
    if (!uid || scanning || detected) return;
    setScanning(true);
    try {
      const res = await fetch(`${apiUrl}/api/deposit/monitor`);
      if (res.ok) {
        const data = await res.json();
        const credited = (data.results || []).find((r: { credited: boolean }) => r.credited);
        if (credited) {
          setDetected(true);
          if (scanInterval.current) clearInterval(scanInterval.current);
          showToast('Deposit detected! Wallet credited.');
          await loadData();
        }
      }
    } catch {}
    setScanning(false);
    setLastScan(Date.now());
  }

  async function openDeposit(network: string) {
    setModalNetwork(network);
    setModalOpen(true);
    setDepositAddress('');
    setDetected(false);
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

  function closeModal() {
    setModalOpen(false);
    if (scanInterval.current) clearInterval(scanInterval.current);
    if (detected) loadData();
  }

  function showDetail(dep: Deposit) {
    setSelectedDeposit(dep);
    setDetailOpen(true);
  }

  if (loading) return <Loading text="Loading deposit info..." />;

  const isBsc = modalNetwork === 'BEP20';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
      {ToastComponent}

      <style>{`
        @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
        @keyframes slideUp{from{transform:translateY(40px);opacity:0;}to{transform:translateY(0);opacity:1;}}
        @keyframes pulseRing{0%{transform:scale(1);opacity:0.4;}50%{transform:scale(1.15);opacity:0.1;}100%{transform:scale(1);opacity:0.4;}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes scanPulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

        {/* Balance Card */}
        <div style={{ background: 'linear-gradient(135deg,rgba(34,197,94,0.1),rgba(96,165,250,0.05))', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 24, padding: '28px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(34,197,94,0.08)', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 10a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 2, color: 'rgba(255,255,255,0.3)' }}>USDT Balance</div>
          </div>
          <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 46, background: 'linear-gradient(135deg,#22c55e,#4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1 }}>{formatUSD(balance)}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 8 }}>Deposit to start mining</div>
        </div>

        {/* POL Live Price */}
        <div style={{ background: 'rgba(130,71,229,0.06)', border: '1px solid rgba(130,71,229,0.12)', borderRadius: 20, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(130,71,229,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src="https://cryptologos.cc/logos/polygon-matic-logo.svg" alt="POL" width="24" height="24" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, color: 'rgba(255,255,255,0.3)', marginBottom: 3 }}>POL Live Price</div>
            <div style={{ fontFamily: SG, fontWeight: 800, fontSize: 20, color: 'white' }}>
              {polPrice > 0 ? `$${polPrice.toFixed(4)}` : '...'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>1 USD =</div>
            <div style={{ fontFamily: SG, fontWeight: 800, fontSize: 16, color: '#8247e5' }}>
              {polPrice > 0 ? `${(1 / polPrice).toFixed(2)} POL` : '...'}
            </div>
          </div>
        </div>

        {/* Network Selection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><polyline points="16 3 21 3 21 8"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          <span style={{ fontFamily: SG, fontWeight: 800, fontSize: 15 }}>Choose Network</span>
        </div>

        {/* BEP20 */}
        <div onClick={() => openDeposit('BEP20')} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '18px 18px', cursor: 'pointer', transition: '0.25s' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(240,185,11,0.1)', border: '1px solid rgba(240,185,11,0.15)' }}>
            <img src="https://cryptologos.cc/logos/tether-usdt-logo.svg" alt="USDT" width="28" height="28" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>USDT (BEP20)</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Binance Smart Chain &middot; ~3 min</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>

        {/* Polygon */}
        <div onClick={() => openDeposit('Polygon')} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '18px 18px', cursor: 'pointer', transition: '0.25s' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(130,71,229,0.1)', border: '1px solid rgba(130,71,229,0.15)' }}>
            <img src="https://cryptologos.cc/logos/polygon-matic-logo.svg" alt="POL" width="28" height="28" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>POL (Polygon)</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Polygon Network &middot; ~2 min</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>

        {/* Auto-detect info */}
        <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.1)', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="16 12 12 8 8 12"/><line x1="12" y1="16" x2="12" y2="8"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e' }}>Auto-Detection Enabled</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Send crypto and it will be credited automatically within 30 seconds</div>
          </div>
        </div>

        {/* Recent Deposits */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, color: 'rgba(255,255,255,0.3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Recent Deposits
          </div>
          {history.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>No deposits yet</div>
          ) : (
            history.map(dep => {
              const isPol = dep.network === 'Polygon';
              const polAmt = isPol ? (dep.polAmount || 0) : 0;
              const usdAmt = Number(dep.amount) || 0;
              const symbol = isPol ? 'POL' : 'USDT';
              const networkColor = isPol ? '#8247e5' : '#26A17B';
              return (
                <div key={dep.id} onClick={() => showDetail(dep)} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 11, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${networkColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={isPol ? "https://cryptologos.cc/logos/polygon-matic-logo.svg" : "https://cryptologos.cc/logos/tether-usdt-logo.svg"} alt={isPol ? "POL" : "USDT"} width="18" height="18" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 12, color: 'white' }}>
                          {isPol ? `${polAmt.toFixed(4)} POL` : `${formatUSD(usdAmt)} USDT`}
                        </div>
                        <div style={{ fontSize: 9, opacity: 0.3, marginTop: 1 }}>{fmtDate(dep.createdAt)}</div>
                      </div>
                    </span>
                    <span style={{ color: dep.status === 'completed' ? '#22c55e' : '#fbbf24', fontWeight: 700, fontSize: 10, padding: '3px 8px', borderRadius: 6, background: dep.status === 'completed' ? 'rgba(34,197,94,0.1)' : 'rgba(251,191,36,0.1)' }}>{dep.status || 'pending'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, paddingLeft: 36, fontSize: 9 }}>
                    <span style={{ color: '#22c55e', fontWeight: 600 }}>
                      ${(isPol ? usdAmt : usdAmt).toFixed(2)} USD
                    </span>
                    {isPol && (
                      <span style={{ color: '#8247e5', fontWeight: 600 }}>
                        @ ${dep.polPrice?.toFixed(4) || '0'} / POL
                      </span>
                    )}
                    {dep.txHash && !dep.txHash.startsWith('auto_') && !dep.txHash.startsWith('pending_') && (
                      <a
                        href={isPol ? `https://polygonscan.com/tx/${dep.txHash}` : `https://bscscan.com/tx/${dep.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', fontSize: 8, textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: 120 }}
                      >
                        {dep.txHash.slice(0, 10)}...{dep.txHash.slice(-6)}
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      {/* DEPOSIT MODAL */}
      {modalOpen && (
        <div onClick={closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 5000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'fadeIn 0.25s' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0b0d18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px 24px 0 0', padding: '20px 20px 32px', maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp 0.35s', textAlign: 'center' }}>
            {/* Handle */}
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 16px' }} />

            {generating ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 24 }}>
                <div style={{ width: 44, height: 44, border: '3px solid rgba(167,139,250,0.1)', borderTop: '3px solid #a78bfa', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Generating deposit address...</div>
              </div>
            ) : detected ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 20 }}>
                <div style={{ position: 'relative', width: 80, height: 80 }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', animation: 'pulseRing 1.5s infinite' }} />
                  <div style={{ position: 'absolute', inset: 4, borderRadius: '50%', background: 'rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="36" height="36" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                </div>
                <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 20, color: '#22c55e' }}>Deposit Detected!</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Your wallet has been credited automatically</div>
                <button onClick={closeModal} style={{ marginTop: 8, width: '100%', padding: 14, border: 'none', borderRadius: 14, background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#000', fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: SG }}>Done</button>
              </div>
            ) : depositAddress ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Network badge */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '6px 16px', borderRadius: 100, marginBottom: 14, background: isBsc ? 'rgba(240,185,11,0.1)' : 'rgba(130,71,229,0.1)', color: isBsc ? '#f0b90b' : '#8247e5', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: 1 }}>
                  {isBsc ? (
                    <img src="https://cryptologos.cc/logos/tether-usdt-logo.svg" alt="USDT" width="16" height="16" />
                  ) : (
                    <img src="https://cryptologos.cc/logos/polygon-matic-logo.svg" alt="POL" width="16" height="16" />
                  )}
                  {isBsc ? 'USDT (BEP20)' : 'POL (Polygon)'}
                </div>

                {/* QR */}
                <div style={{ background: 'white', borderRadius: 16, padding: 10, display: 'inline-block', marginBottom: 14 }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(depositAddress)}`} alt="QR" style={{ width: 180, height: 180, display: 'block' }} />
                </div>

                {/* Address */}
                <div style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 600, color: 'rgba(255,255,255,0.5)', wordBreak: 'break-all' as const, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 12, width: '100%', marginBottom: 12 }}>{depositAddress}</div>

                {/* Copy button */}
                <button onClick={() => { navigator.clipboard.writeText(depositAddress); showToast('Address copied!'); }} style={{ width: '100%', padding: 12, border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 12, cursor: 'pointer', background: isBsc ? 'linear-gradient(135deg,#f0b90b,#e0a800)' : 'linear-gradient(135deg,#8247e5,#6a35c9)', color: isBsc ? '#000' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy Address
                </button>

                {/* Scanning status */}
                <div style={{ marginTop: 16, width: '100%', background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.12)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#a78bfa', animation: 'scanPulse 2s infinite', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa' }}>Auto-Scanning</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                      Checking every 30s &middot; {lastScan ? `Last: ${new Date(lastScan).toLocaleTimeString()}` : 'Starting scan...'}
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div style={{ fontSize: 10, color: 'rgba(239,68,68,0.5)', padding: '10px 14px', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.08)', borderRadius: 10, marginTop: 10, lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  Send only {isBsc ? 'USDT (BEP20)' : 'POL (Polygon)'} to this address
                </div>

                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 10 }}>#{depositIndex} &middot; Address auto-detected on blockchain</div>
              </div>
            ) : null}

            <button onClick={closeModal} style={{ marginTop: 14, padding: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: 11, cursor: 'pointer', width: '100%', border: '1px solid rgba(255,255,255,0.06)' }}>Close</button>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailOpen && selectedDeposit && (
        <div onClick={() => setDetailOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 5000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'fadeIn 0.25s' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0b0d18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px 24px 0 0', padding: '20px 20px 32px', maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp 0.35s' }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 16px' }} />
            <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 16, marginBottom: 16 }}>Deposit Details</div>
            {(() => {
              const isPol = selectedDeposit.network === 'Polygon';
              const symbol = isPol ? 'POL' : 'USDT';
              const rawAmt = isPol ? (selectedDeposit.polAmount || 0) : (Number(selectedDeposit.amount) || 0);
              const usdAmt = Number(selectedDeposit.amount) || 0;
              const networkColor = isPol ? '#8247e5' : '#26A17B';
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${networkColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={isPol ? "https://cryptologos.cc/logos/polygon-matic-logo.svg" : "https://cryptologos.cc/logos/tether-usdt-logo.svg"} alt={isPol ? "POL" : "USDT"} width="24" height="24" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>{rawAmt.toFixed(isPol ? 4 : 2)} {symbol}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{isPol ? 'Polygon' : 'BEP20'}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: '#22c55e' }}>${usdAmt.toFixed(2)}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>USD Value</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 2.4, color: 'rgba(255,255,255,0.5)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span style={{ color: 'rgba(255,255,255,0.3)' }}>Date</span><span style={{ color: 'white' }}>{fmtDate(selectedDeposit.createdAt)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span style={{ color: 'rgba(255,255,255,0.3)' }}>Network</span><span style={{ color: 'white' }}>{selectedDeposit.network}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span style={{ color: 'rgba(255,255,255,0.3)' }}>Amount</span><span style={{ color: 'white', fontWeight: 700 }}>{rawAmt.toFixed(isPol ? 4 : 2)} {symbol}</span></div>
                    {isPol && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span style={{ color: 'rgba(255,255,255,0.3)' }}>POL Price</span><span style={{ color: '#8247e5' }}>${selectedDeposit.polPrice?.toFixed(4) || '0'}</span></div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span style={{ color: 'rgba(255,255,255,0.3)' }}>USD Value</span><span style={{ color: '#22c55e', fontWeight: 700 }}>${usdAmt.toFixed(2)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span style={{ color: 'rgba(255,255,255,0.3)' }}>Status</span><span style={{ color: '#22c55e', fontWeight: 700 }}>{selectedDeposit.status || 'pending'}</span></div>
                    {selectedDeposit.txHash && (
                      <div style={{ padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: 6 }}>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>TX Hash</span>
                        {selectedDeposit.txHash.startsWith('auto_') || selectedDeposit.txHash.startsWith('pending_') ? (
                          <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', wordBreak: 'break-all' as const, marginTop: 4, lineHeight: 1.4 }}>{selectedDeposit.txHash}</div>
                        ) : (
                          <a
                            href={isPol ? `https://polygonscan.com/tx/${selectedDeposit.txHash}` : `https://bscscan.com/tx/${selectedDeposit.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 9, fontFamily: 'monospace', color: '#a78bfa', wordBreak: 'break-all' as const, marginTop: 4, lineHeight: 1.4, textDecoration: 'underline', display: 'block' }}
                          >
                            {selectedDeposit.txHash}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
            <button onClick={() => setDetailOpen(false)} style={{ marginTop: 16, padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: 11, cursor: 'pointer', width: '100%', border: '1px solid rgba(255,255,255,0.06)' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
