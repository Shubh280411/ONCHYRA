'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl, formatUSD } from '@/lib/utils';
import type { Deposit } from '@/types';
import Loading from '@/components/ui/Loading';

const NETWORKS = [
  { id: 'BEP20', name: 'USDT (BEP20)', desc: 'Binance Smart Chain', iconColor: 'bg-yellow-500/[0.12]' },
  { id: 'Polygon', name: 'POL (Polygon)', desc: 'Polygon Network', iconColor: 'bg-purple-500/[0.12]' },
];

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
    } catch { /* silent */ }
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

  function fmtDate(ts: number) {
    if (!ts) return '-';
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function showDetail(dep: Deposit) {
    setSelectedDeposit(dep);
    setDetailOpen(true);
  }

  if (loading) return <Loading text="Loading deposit info..." />;

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
          Wallet <span className="font-[family-name:var(--font-space-grotesk)] text-[var(--primary)]">{formatUSD(balance)}</span>
        </span>
      </div>

      {/* Balance Hero */}
      <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/5 border border-purple-500/12 rounded-3xl p-6 text-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-[120px] h-[120px] rounded-full bg-purple-500/[0.08] blur-2xl pointer-events-none" />
        <div className="text-[10px] font-bold uppercase tracking-[2px] text-white/25">Available Balance</div>
        <div className="font-[family-name:var(--font-space-grotesk)] font-black text-[42px] bg-gradient-to-r from-white via-purple-400/60 to-transparent bg-clip-text text-transparent leading-tight">
          {formatUSD(balance)}
        </div>
        <div className="text-[11px] text-white/20 mt-1.5">Deposit to start mining</div>
      </div>

      {/* Title */}
      <h1 className="font-[family-name:var(--font-space-grotesk)] font-extrabold text-xl flex items-center gap-2">
        <svg width="22" height="22" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24" style={{ verticalAlign: '-4px' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /><polyline points="16 3 21 3 21 8" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
        Deposit Funds
      </h1>
      <p className="text-white/40 text-xs -mt-2">Choose a network to deposit</p>

      {/* Network Cards */}
      {NETWORKS.map(net => (
        <button
          key={net.id}
          onClick={() => openDeposit(net.id)}
          className="flex items-center gap-4 bg-white/[0.03] border border-white/[0.06] rounded-3xl p-5 text-left transition-all active:scale-[0.97] w-full"
        >
          <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 ${net.iconColor}`}>
            <img
              src={net.id === 'BEP20' ? 'https://cryptologos.cc/logos/tether-usdt-logo.svg' : 'https://cryptologos.cc/logos/polygon-matic-logo.svg'}
              alt={net.name}
              className="w-7 h-7"
            />
          </div>
          <div className="flex-1">
            <div className="font-bold text-[15px]">{net.name}</div>
            <div className="text-[11px] text-white/40 mt-0.5">{net.desc}</div>
          </div>
          <svg className="text-white/20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      ))}

      {/* Recent Deposits */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-white/30 mb-3 flex items-center gap-2">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          Recent Deposits
        </div>
        {history.length === 0 ? (
          <div className="py-5 text-center text-[11px] text-white/20">No deposits yet</div>
        ) : (
          history.map(dep => {
            const isPol = dep.network === 'Polygon';
            const rawAmt = isPol ? (Number(dep.polAmount) || 0) : (Number(dep.amount) || 0);
            const symbol = isPol ? 'POL' : 'USDT';
            return (
              <div
                key={dep.id}
                onClick={() => showDetail(dep)}
                className="flex justify-between items-center p-3 bg-white/[0.02] rounded-xl mb-1.5 last:mb-0 text-[11px] cursor-pointer hover:bg-white/[0.04] transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <img src={isPol ? 'https://cryptologos.cc/logos/polygon-matic-logo.svg' : 'https://cryptologos.cc/logos/tether-usdt-logo.svg'} alt={symbol} className="w-3.5 h-3.5" />
                  {isPol ? `${rawAmt} POL` : `${formatUSD(Number(dep.amount) || 0)} USDT`}
                  <span className="opacity-30 ml-1">{fmtDate(dep.createdAt)}</span>
                </span>
                <span style={{ color: dep.status === 'completed' ? '#22c55e' : '#fbbf24' }} className="font-bold">{dep.status}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Deposit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-[8px] z-[1000] flex items-end justify-center p-5" onClick={() => setModalOpen(false)}>
          <div className="bg-[var(--bg)] border border-white/[0.1] rounded-[32px] p-7 max-w-[440px] w-full max-h-[90vh] overflow-y-auto text-center" onClick={e => e.stopPropagation()}>
            {generating ? (
              <div className="py-5 text-xs text-white/20">Generating address...</div>
            ) : depositAddress ? (
              <div className="flex flex-col items-center">
                <div className="bg-white rounded-2xl p-3 inline-block mb-3">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(depositAddress)}`} alt="QR" className="w-[200px] h-[200px] block" />
                </div>
                <div className={`inline-flex items-center gap-1.5 text-[11px] px-4 py-1.5 rounded-full mb-3 ${modalNetwork === 'BEP20' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-purple-500/10 text-purple-400'}`}>
                  <img src={modalNetwork === 'BEP20' ? 'https://cryptologos.cc/logos/bnb-bnb-logo.svg' : 'https://cryptologos.cc/logos/polygon-matic-logo.svg'} alt="" className="w-3.5 h-3.5" />
                  {modalNetwork === 'BEP20' ? 'USDT (BEP20)' : 'POL (Polygon)'}
                </div>
                <div className="text-[11px] font-mono font-semibold text-white/60 word-break bg-white/[0.02] border border-white/[0.1] rounded-[14px] p-3.5 mb-3 w-full">{depositAddress}</div>
                <button
                  onClick={() => { navigator.clipboard.writeText(depositAddress); showToast('Address copied!'); }}
                  className={`px-6 py-2.5 rounded-xl font-extrabold text-xs cursor-pointer ${modalNetwork === 'BEP20' ? 'bg-yellow-400 text-black' : 'bg-purple-600 text-white'}`}
                >
                  Copy Address
                </button>
                <div className="text-[10px] text-white/20 mt-2">#{depositIndex} — {modalNetwork}</div>
                <div className="text-[10px] text-red-400/60 px-2.5 py-2.5 bg-red-500/[0.04] border border-red-500/[0.08] rounded-[10px] mt-2.5 leading-relaxed">
                  Send only {modalNetwork === 'BEP20' ? 'USDT (BEP20)' : 'POL (Polygon)'}
                </div>
                <div className="text-[11px] text-white/30 mt-3">Waiting for deposit... (typically 1-5 min)</div>
              </div>
            ) : null}
            <button onClick={() => setModalOpen(false)} className="mt-4 w-full py-2.5 border-none bg-white/[0.04] rounded-[10px] text-white/30 font-bold text-[11px] cursor-pointer">Close</button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailOpen && selectedDeposit && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-[8px] z-[1000] flex items-end justify-center p-5" onClick={() => setDetailOpen(false)}>
          <div className="bg-[var(--bg)] border border-white/[0.1] rounded-[32px] p-7 max-w-[440px] w-full max-h-[90vh] overflow-y-auto text-left" onClick={e => e.stopPropagation()}>
            <div className="font-[family-name:var(--font-space-grotesk)] font-black text-base mb-4">Deposit Details</div>
            <div className="flex items-center gap-3 mb-4 p-3 bg-white/[0.02] rounded-xl">
              <img src={selectedDeposit.network === 'Polygon' ? 'https://cryptologos.cc/logos/polygon-matic-logo.svg' : 'https://cryptologos.cc/logos/tether-usdt-logo.svg'} alt="" className="w-8 h-8" />
              <div>
                <div className="font-bold text-[15px]">
                  {selectedDeposit.network === 'Polygon' ? `${Number(selectedDeposit.polAmount) || 0} POL` : `${formatUSD(Number(selectedDeposit.amount) || 0)} USDT`}
                </div>
                <div className="text-[11px] text-white/30">{selectedDeposit.network === 'Polygon' ? 'Polygon' : 'BEP20'}</div>
              </div>
              <div className="ml-auto text-right">
                <div className="font-bold text-[15px] text-green-400">{formatUSD(Number(selectedDeposit.amount) || 0)}</div>
                <div className="text-[10px] text-white/20">USD Value</div>
              </div>
            </div>
            <div className="text-[11px] leading-loose text-white/50">
              <div className="flex justify-between py-1"><span className="text-white/30">Date</span><span>{fmtDate(selectedDeposit.createdAt)}</span></div>
              <div className="flex justify-between py-1"><span className="text-white/30">Amount</span><span>{selectedDeposit.network === 'Polygon' ? `${Number(selectedDeposit.polAmount) || 0} POL` : `${formatUSD(Number(selectedDeposit.amount) || 0)} USDT`}</span></div>
              {selectedDeposit.network === 'Polygon' && <div className="flex justify-between py-1"><span className="text-white/30">POL Price</span><span>${(Number(selectedDeposit.polPrice) || 0).toFixed(4)}</span></div>}
              <div className="flex justify-between py-1"><span className="text-white/30">USD Value</span><span className="text-green-400 font-bold">{formatUSD(Number(selectedDeposit.amount) || 0)}</span></div>
              <div className="flex justify-between py-1"><span className="text-white/30 whitespace-nowrap mr-2">TX Hash</span><span className="text-white/60 font-mono text-[10px] text-right break-all">{selectedDeposit.txHash || '-'}</span></div>
              <div className="flex justify-between py-1"><span className="text-white/30">Status</span><span style={{ color: selectedDeposit.status === 'completed' ? '#22c55e' : '#fbbf24' }} className="font-bold">{selectedDeposit.status}</span></div>
            </div>
            <button onClick={() => setDetailOpen(false)} className="mt-4 w-full py-2.5 border-none bg-white/[0.04] rounded-[10px] text-white/30 font-bold text-[11px] cursor-pointer">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
