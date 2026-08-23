'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl, formatTimeAgo } from '@/lib/utils';
import Loading from '@/components/ui/Loading';

interface TransferHistory {
  id: string;
  from: string;
  to: string;
  fromName: string;
  toName: string;
  amount: number;
  burn: number;
  receive: number;
  note: string;
  dir: 'sent' | 'received';
  timestamp: number;
}

export default function P2PTransferPage() {
  const { uid } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const apiUrl = detectApiUrl();

  const [balance, setBalance] = useState(0);
  const [recipientCode, setRecipientCode] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientDisplayName, setRecipientDisplayName] = useState('');
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'searching' | 'found' | 'error'>('idle');
  const [lookupText, setLookupText] = useState('Type a referral code to search');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<TransferHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [lookupTimeout, setLookupTimeoutState] = useState<ReturnType<typeof setTimeout> | null>(null);

  const amountNum = useMemo(() => parseFloat(amount) || 0, [amount]);
  const burn = useMemo(() => amountNum * 0.1, [amountNum]);
  const receive = useMemo(() => amountNum - burn, [amountNum, burn]);

  const canSend = uid && recipientId && amountNum >= 1 && amountNum <= 500 && amountNum <= balance;

  useEffect(() => {
    if (!uid) return;
    loadData();
    return () => { if (lookupTimeout) clearTimeout(lookupTimeout); };
  }, [uid]);

  async function loadData() {
    setLoading(true);
    try {
      const [userRes, histRes] = await Promise.all([
        fetch(`${apiUrl}/api/user/${uid}`),
        fetch(`${apiUrl}/api/transfers/${uid}`),
      ]);
      if (userRes.ok) {
        const d = await userRes.json();
        setBalance(Number(d.balance) || 0);
      }
      if (histRes.ok) {
        setHistory(await histRes.json());
      }
    } catch { /* silent */ }
    setLoading(false);
  }

  function handleRecipientChange(val: string) {
    if (lookupTimeout) clearTimeout(lookupTimeout);
    setRecipientCode(val);
    setRecipientId(null);
    setRecipientDisplayName('');
    const v = val.trim().toUpperCase();
    if (v.length < 3) {
      setLookupStatus('idle');
      setLookupText('Type a referral code to search');
      return;
    }
    setLookupStatus('searching');
    setLookupText('Looking up...');
    const t = setTimeout(() => lookupRecipient(v), 500);
    setLookupTimeoutState(t);
  }

  async function lookupRecipient(code: string) {
    try {
      const res = await fetch(`${apiUrl}/api/check-referral/${code}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      if (!data.found) {
        setLookupStatus('error');
        setLookupText('Network ID not found');
        return;
      }
      if (data.uid === uid) {
        setLookupStatus('error');
        setLookupText('Cannot send to yourself');
        return;
      }
      setRecipientId(data.uid);
      setRecipientName(data.name || 'User');
      setRecipientDisplayName(data.name || 'User');
      setLookupStatus('found');
      setLookupText('Recipient verified');
    } catch {
      setLookupStatus('error');
      setLookupText('Network ID not found');
    }
  }

  async function sendTransfer() {
    if (!canSend || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${apiUrl}/api/transfer/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUid: uid, toCode: recipientCode.trim().toUpperCase(), amount: amountNum, note: note.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transfer failed');
      showToast(`Sent ${receive.toFixed(2)} ONC to ${recipientDisplayName}`);
      setBalance(prev => prev - amountNum);
      setAmount('');
      setRecipientCode('');
      setNote('');
      setRecipientId(null);
      setRecipientDisplayName('');
      setLookupStatus('idle');
      setLookupText('Type a referral code to search');
      loadData();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Transfer failed', 'error');
    }
    setSending(false);
  }

  function setMax() {
    if (balance < 1) { showToast('Insufficient balance', 'error'); return; }
    setAmount(Math.min(balance, 500).toFixed(2));
  }

  if (loading) return <Loading text="Securing channel..." />;

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
        <span className="text-[9px] font-extrabold text-white/25 tracking-wider">P2P</span>
      </div>

      {/* Badge + Heading */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-3.5 py-2 bg-purple-500/[0.08] border border-purple-500/15 rounded-full text-[9px] font-extrabold tracking-wider text-[var(--primary)] uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] shadow-[0_0_8px_var(--primary)] animate-pulse" />
          P2P TRANSFER
        </div>
        <div className="w-10 h-10 flex items-center justify-center bg-yellow-500/[0.08] border border-yellow-500/15 rounded-xl">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 23c-4.97 0-9-3.58-9-8 0-3.07 2.25-5.74 3.84-7.54C8.29 5.86 9.5 4.2 9.5 2c0 0 1.5 1 3 3.5C14 8 15 10 15 12c0-1 1-3 3-4.5.5 1.5.5 3.5.5 5.5 0 5.52-2.91 10-6.5 10z" fill="rgba(251,191,36,0.15)" />
            <path d="M12 20c-2.76 0-5-2.24-5-5 0-2.15 1.65-3.86 2.5-4.8.8-1.06 1.5-2.2 1.5-3.7 0 0 0.8 1.1 1.5 2.7.7 1.6 1.5 3.2 1.5 4.8 0-0.7 0.7-2 2.5-3.2.3 0.9.3 2 0.3 3.2 0 3.31-2.02 6-4.8 6z" fill="#fbbf24" opacity="0.9" />
          </svg>
        </div>
      </div>
      <h1 className="font-[family-name:var(--font-space-grotesk)] font-extrabold text-3xl -mt-1 tracking-tight">Send ONC</h1>
      <div className="inline-flex items-center gap-2 bg-purple-500/[0.06] border border-purple-500/12 rounded-full px-4 py-2 text-xs font-semibold w-fit">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
        Balance <span className="font-[family-name:var(--font-space-grotesk)] font-extrabold text-base bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">{balance.toFixed(2)}</span> ONC
      </div>

      {/* Transfer Card */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-5 relative overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle_at_30%_20%,rgba(167,139,250,0.03)_0%,transparent_60%)] pointer-events-none" />
        <div className="absolute top-0 left-[15%] w-[70%] h-px bg-gradient-to-r from-transparent via-purple-500/20 to-blue-500/30" />

        {/* Recipient */}
        <div className="mb-4">
          <label className="block text-[9px] font-extrabold tracking-[1.8px] uppercase text-white/50 mb-2 flex items-center gap-2">
            <span className="w-4 h-0.5 bg-[var(--primary)] rounded shadow-[0_0_8px_rgba(167,139,250,0.3)]" />
            Recipient Network ID
          </label>
          <input
            type="text"
            value={recipientCode}
            onChange={e => handleRecipientChange(e.target.value)}
            placeholder="Enter referral code"
            maxLength={12}
            className="w-full px-4 py-3.5 rounded-xl border border-white/[0.07] bg-white/[0.03] text-white text-sm outline-none transition-all focus:border-purple-500/30 focus:bg-white/[0.06] placeholder:text-white/20"
          />
          {recipientId && (
            <div className="flex items-center gap-3.5 mt-3 p-3.5 bg-purple-500/[0.06] border border-purple-500/15 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center shrink-0 font-[family-name:var(--font-space-grotesk)] font-extrabold text-lg text-white">
                {recipientDisplayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold">{recipientDisplayName}</div>
                <div className="text-[11px] text-white/40 mt-0.5 font-mono tracking-wider">{recipientCode}</div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
            </div>
          )}
          <div className={`flex items-center gap-1.5 mt-2 text-[10px] font-semibold min-h-[18px] ${
            lookupStatus === 'found' ? 'text-green-400' :
            lookupStatus === 'error' ? 'text-red-400' :
            lookupStatus === 'searching' ? 'text-[var(--secondary)]' :
            'text-white/20'
          }`}>
            {lookupText}
          </div>
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label className="block text-[9px] font-extrabold tracking-[1.8px] uppercase text-white/50 mb-2 flex items-center gap-2">
            <span className="w-4 h-0.5 bg-[var(--primary)] rounded shadow-[0_0_8px_rgba(167,139,250,0.3)]" />
            Amount
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="Minimum 1 ONC"
            className="w-full px-4 py-3.5 rounded-xl border border-white/[0.07] bg-white/[0.03] text-white text-sm outline-none transition-all focus:border-purple-500/30 focus:bg-white/[0.06] placeholder:text-white/20"
          />
        </div>

        {/* Note */}
        <div className="mb-0">
          <label className="block text-[9px] font-extrabold tracking-[1.8px] uppercase text-white/50 mb-2 flex items-center gap-2">
            <span className="w-4 h-0.5 bg-[var(--primary)] rounded shadow-[0_0_8px_rgba(167,139,250,0.3)]" />
            Note <span className="text-white/20 font-normal tracking-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="What's this for?"
            maxLength={100}
            className="w-full px-4 py-3.5 rounded-xl border border-white/[0.07] bg-white/[0.03] text-white text-sm outline-none transition-all focus:border-purple-500/30 focus:bg-white/[0.06] placeholder:text-white/20"
          />
        </div>

        {/* Breakdown */}
        <div className="mt-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4">
          <div className="flex justify-between items-center py-1.5 text-xs">
            <span className="text-white/45 font-medium flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              Total Amount
            </span>
            <span className="font-bold font-[family-name:var(--font-space-grotesk)] text-[var(--secondary)]">{amountNum.toFixed(2)} ONC</span>
          </div>
          <div className="flex justify-between items-center py-1.5 text-xs">
            <span className="text-white/45 font-medium flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              10% Network Burn
            </span>
            <span className="font-bold font-[family-name:var(--font-space-grotesk)] text-pink-400">{burn.toFixed(2)} ONC</span>
          </div>
          <div className="h-px bg-white/[0.04] my-2" />
          <div className="flex justify-between items-center py-1.5 text-xs">
            <span className="text-white/80 font-bold flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              Receivable Amount
            </span>
            <span className="font-bold font-[family-name:var(--font-space-grotesk)] text-lg text-green-400">{receive.toFixed(2)} ONC</span>
          </div>
        </div>

        {/* Limits */}
        <div className="flex gap-2 mt-4">
          <div className="flex-1 bg-white/[0.02] border border-white/[0.04] rounded-xl py-2 px-2.5 text-center">
            <div className="text-[7px] font-bold tracking-wider uppercase text-white/20">Max / Tx</div>
            <div className="text-[11px] font-bold text-[var(--secondary)] mt-0.5">500 ONC</div>
          </div>
          <div className="flex-1 bg-white/[0.02] border border-white/[0.04] rounded-xl py-2 px-2.5 text-center">
            <div className="text-[7px] font-bold tracking-wider uppercase text-white/20">Daily Limit</div>
            <div className="text-[11px] font-bold text-pink-400 mt-0.5">3 / 24h</div>
          </div>
        </div>

        {/* Send Button */}
        <button
          onClick={sendTransfer}
          disabled={!canSend || sending}
          className="mt-5 w-full py-4 rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-black font-[family-name:var(--font-space-grotesk)] font-extrabold text-sm tracking-wider uppercase transition-all hover:shadow-[0_6px_40px_rgba(167,139,250,0.4)] hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none flex items-center justify-center gap-2.5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
          {sending ? 'Processing...' : 'Send ONC'}
        </button>
      </div>

      {/* Bottom Links */}
      <div className="flex items-center justify-center gap-5 text-[11px] font-semibold text-white/25 py-2">
        <Link href="/dashboard" className="text-white/40 no-underline flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          Dashboard
        </Link>
        <span className="w-[3px] h-[3px] rounded-full bg-white/15" />
        <button onClick={setMax} className="text-white/40 flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors bg-transparent border-none cursor-pointer text-[11px] font-semibold">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
          Max
        </button>
        <span className="w-[3px] h-[3px] rounded-full bg-white/15" />
        <button onClick={() => { setAmount(''); setNote(''); }} className="text-white/40 flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors bg-transparent border-none cursor-pointer text-[11px] font-semibold">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          Clear
        </button>
      </div>

      {/* History */}
      <div>
        <div className="flex items-center justify-between px-1 pb-2">
          <h3 className="font-[family-name:var(--font-space-grotesk)] font-extrabold text-sm flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            Transfer History
          </h3>
          <span className="text-[10px] font-bold text-white/30 bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 rounded-full">{history.length}</span>
        </div>
        <div className="flex flex-col gap-1.5 max-h-[380px] overflow-y-auto scrollbar-thin">
          {history.length === 0 ? (
            <div className="py-7 text-center text-xs text-white/20">No transfers yet</div>
          ) : (
            history.slice(0, 30).map(tx => {
              const isSent = tx.from === uid;
              return (
                <div key={tx.id} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isSent ? 'bg-pink-500/[0.12]' : 'bg-green-500/[0.12]'}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isSent ? '#f472b6' : '#22c55e'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
                      {isSent ? null : <g transform="rotate(180,12,12)"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></g>}
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold">{isSent ? 'Sent' : 'Received'}</div>
                    <div className="text-[10px] text-white/35 mt-0.5">
                      {isSent ? 'To' : 'From'} {isSent ? (tx.toName || tx.to.slice(0, 6).toUpperCase()) : (tx.fromName || tx.from.slice(0, 6).toUpperCase())} &middot; {tx.timestamp ? formatTimeAgo(tx.timestamp) : ''}
                    </div>
                    {tx.note && <div className="text-[11px] text-white/45 mt-0.5 italic truncate max-w-[180px]">&quot;{tx.note}&quot;</div>}
                  </div>
                  <div className={`font-[family-name:var(--font-space-grotesk)] font-extrabold text-xs text-right ${isSent ? 'text-pink-400' : 'text-green-400'}`}>
                    {isSent ? '-' : '+'}{Number(isSent ? tx.amount : tx.receive).toFixed(2)} ONC
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
