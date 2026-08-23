'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl, formatUSD } from '@/lib/utils';
import type { Withdrawal } from '@/types';

export default function WithdrawPage() {
  const { uid } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const apiUrl = detectApiUrl();

  const [balance, setBalance] = useState(0);
  const [userEmail, setUserEmail] = useState('');
  const [wallet, setWallet] = useState('');
  const [amount, setAmount] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  const amountNum = useMemo(() => parseFloat(amount) || 0, [amount]);
  const fee = useMemo(() => amountNum * 0.05, [amountNum]);
  const receive = useMemo(() => amountNum - fee, [amountNum, fee]);

  const totalWithdrawn = useMemo(() => {
    return history
      .filter((w) => w.status === 'completed')
      .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
  }, [history]);

  const pendingTotal = useMemo(() => {
    return history
      .filter((w) => w.status === 'pending' || w.status === 'processing')
      .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
  }, [history]);

  const canSendOtp = wallet.startsWith('0x') && wallet.length >= 20 && amountNum >= 10 && amountNum <= balance;

  useEffect(() => {
    if (!uid) return;
    fetchBalance();
    fetchHistory();
  }, [uid]);

  async function fetchBalance() {
    try {
      const res = await fetch(`${apiUrl}/api/user/${uid}`);
      if (res.ok) {
        const data = await res.json();
        setBalance(data.commissionBalance || data.balance || 0);
        setUserEmail(data.email || '');
      }
    } catch { /* silent */ }
  }

  async function fetchHistory() {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/withdrawals/${uid}`);
      if (res.ok) {
        setHistory(await res.json());
      }
    } catch {
      // silent
    }
    setLoading(false);
  }

  async function sendOtp() {
    if (!userEmail) return;
    setSendingOtp(true);
    try {
      const res = await fetch(`${apiUrl}/api/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, purpose: 'withdrawal' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setOtpSent(true);
      showToast('OTP sent to your email');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to send OTP', 'error');
    }
    setSendingOtp(false);
  }

  async function verifyOtp() {
    if (!userEmail || otp.length !== 6) return;
    try {
      const res = await fetch(`${apiUrl}/api/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      setOtpVerified(true);
      showToast('OTP verified');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Invalid OTP', 'error');
    }
  }

  async function submitWithdraw() {
    if (amountNum < 10) return showToast('Minimum withdrawal is $10', 'error');
    if (amountNum > balance) return showToast('Insufficient balance', 'error');
    if (!wallet.startsWith('0x') || wallet.length < 20) return showToast('Invalid wallet address', 'error');
    if (!otpVerified) return showToast('Verify OTP first', 'error');

    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/withdraw/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, amount: amountNum, wallet, network: 'BEP20', otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      showToast('Withdrawal submitted');
      setBalance((prev) => prev - amountNum);
      setAmount('');
      setWallet('');
      setOtp('');
      setOtpSent(false);
      setOtpVerified(false);
      fetchHistory();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Request failed', 'error');
    }
    setSubmitting(false);
  }

  function statusColor(s: string) {
    if (s === 'completed') return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (s === 'pending') return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    if (s === 'processing') return 'text-[var(--primary)] bg-purple-500/10 border-purple-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  }

  return (
    <div className="min-h-screen px-4 py-5 max-w-md mx-auto flex flex-col gap-3.5">
      {ToastComponent}

      {/* Header */}
      <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3.5">
        <Link
          href="/dashboard"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06] text-white shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
        </Link>
        <span className="font-[family-name:var(--font-space-grotesk)] font-black text-lg bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent flex-1">
          ONCHYRA
        </span>
        <span className="text-[11px] font-bold bg-purple-500/10 border border-purple-500/15 px-3.5 py-1.5 rounded-full whitespace-nowrap">
          Commission <span className="font-[family-name:var(--font-space-grotesk)] text-[var(--primary)]">{formatUSD(balance)}</span>
        </span>
      </div>

      {/* Title */}
      <h1 className="font-[family-name:var(--font-space-grotesk)] font-extrabold text-xl">Withdraw</h1>
      <p className="text-white/40 text-xs -mt-2">BEP20 &mdash; Min $10 | 5% fee</p>

      {/* Summary */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-3 py-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="font-[family-name:var(--font-space-grotesk)] font-black text-sm">{formatUSD(balance)}</div>
            <div className="text-[8px] text-white/25 uppercase tracking-wider mt-1">Commission</div>
          </div>
          <div>
            <div className="font-[family-name:var(--font-space-grotesk)] font-black text-sm text-green-400">{formatUSD(totalWithdrawn)}</div>
            <div className="text-[8px] text-white/25 uppercase tracking-wider mt-1">Withdrawn</div>
          </div>
          <div>
            <div className="font-[family-name:var(--font-space-grotesk)] font-black text-sm text-yellow-400">{formatUSD(pendingTotal)}</div>
            <div className="text-[8px] text-white/25 uppercase tracking-wider mt-1">Pending</div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-white/25 mb-4">Withdrawal Request</div>

        {/* Network badge */}
        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-purple-500/[0.06] border border-purple-500/[0.12] rounded-xl mb-4 text-xs">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#26a17b"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          <span className="text-white/40">Network: <strong className="text-[var(--primary)]">BEP20</strong> &bull; Asset: <strong className="text-[var(--primary)]">USDT</strong></span>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2.5 px-3.5 py-3 mb-4 bg-red-500/[0.08] border border-red-500/20 rounded-xl text-[11px] leading-relaxed text-white/60 animate-pulse-slow">
          <svg className="shrink-0 mt-0.5 text-red-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          <span><strong className="text-red-400">Verify your wallet address carefully.</strong> Funds sent to a wrong address cannot be recovered.</span>
        </div>

        {/* Wallet */}
        <div className="mb-3.5">
          <label className="block text-[9px] font-bold uppercase tracking-wider text-white/30 mb-1.5">Wallet Address</label>
          <input
            type="text"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-white text-sm outline-none transition-all focus:border-[var(--primary)]/35 focus:bg-white/[0.06] placeholder:text-white/20"
          />
        </div>

        {/* Amount */}
        <div className="mb-3.5">
          <label className="block text-[9px] font-bold uppercase tracking-wider text-white/30 mb-1.5">Amount (USDT)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="10"
            min="10"
            step="0.01"
            className="w-full px-4 py-3.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-white text-sm outline-none transition-all focus:border-[var(--primary)]/35 focus:bg-white/[0.06] placeholder:text-white/20"
          />
        </div>

        {/* Fee calc */}
        <div className="flex justify-between py-2.5 border-b border-white/[0.03] text-xs">
          <span className="text-white/35">Amount</span>
          <span className="font-bold font-[family-name:var(--font-space-grotesk)]">{formatUSD(amountNum)}</span>
        </div>
        <div className="flex justify-between py-2.5 border-b border-white/[0.03] text-xs">
          <span className="text-white/35">Fee (5%)</span>
          <span className="font-bold font-[family-name:var(--font-space-grotesk)] text-red-400">{formatUSD(fee)}</span>
        </div>
        <div className="flex justify-between py-2.5 text-xs">
          <span className="text-white/35">You Receive</span>
          <span className="font-bold font-[family-name:var(--font-space-grotesk)] text-green-400">{formatUSD(receive)}</span>
        </div>

        {/* OTP section */}
        {!otpSent ? (
          <button
            onClick={sendOtp}
            disabled={!canSendOtp || sendingOtp}
            className="w-full mt-3 py-4 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-black font-[family-name:var(--font-space-grotesk)] font-black text-sm transition-all hover:opacity-90 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {sendingOtp ? 'Sending...' : 'Send OTP'}
          </button>
        ) : (
          <div className="mt-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                className="flex-1 px-4 py-3.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-white text-xl font-[family-name:var(--font-space-grotesk)] font-black text-center tracking-[6px] outline-none transition-all focus:border-[var(--primary)]/35 placeholder:text-xs placeholder:tracking-normal placeholder:font-medium placeholder:text-white/20"
              />
              {!otpVerified && (
                <button
                  onClick={verifyOtp}
                  disabled={otp.length !== 6}
                  className="px-5 py-3.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-black font-[family-name:var(--font-space-grotesk)] font-black text-xs whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Verify
                </button>
              )}
            </div>
            {otpVerified && (
              <div className="mt-2 text-xs text-green-400 text-center font-bold">OTP Verified</div>
            )}
          </div>
        )}

        {/* Submit */}
        {otpVerified && (
          <button
            onClick={submitWithdraw}
            disabled={submitting}
            className="w-full mt-3 py-4 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-black font-[family-name:var(--font-space-grotesk)] font-black text-sm transition-all hover:opacity-90 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {submitting ? 'Processing...' : 'Withdraw'}
          </button>
        )}

        {/* Rules */}
        <div className="text-[11px] text-white/30 leading-relaxed p-3.5 bg-white/[0.02] rounded-xl mt-3">
          <strong className="text-white/50">Rules:</strong> Min $10 &bull; 5% fee deducted ($10&ndash;$50 auto-send, &gt;$50 needs admin approval)<br />
          Insufficient balance or invalid address will be rejected.
        </div>
      </div>

      {/* History */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl overflow-hidden">
        <div className="flex justify-between items-center px-5 pt-4 pb-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-white/25">Withdrawal History</div>
          <div className="text-[10px] text-white/15">{history.length}</div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8 gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse [animation-delay:0.2s]" />
            <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse [animation-delay:0.4s]" />
          </div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-xs text-white/15">No withdrawals yet</div>
        ) : (
          history.map((w) => (
            <div key={w.id} className="grid grid-cols-[70px_1fr_80px] gap-2 px-5 py-3.5 border-b border-white/[0.03] items-center last:border-b-0">
              <div className="font-[family-name:var(--font-space-grotesk)] font-black text-sm">{formatUSD(Number(w.amount) || 0)}</div>
              <div className="text-[10px] text-white/25 leading-snug">
                Fee: {formatUSD(Number(w.fee) || 0)} &bull; Net: {formatUSD((Number(w.amount) || 0) - (Number(w.fee) || 0))}<br />
                {new Date(w.createdAt).toLocaleDateString()}
                {w.txHash && (
                  <>
                    <br />
                    <a href={`https://bscscan.com/tx/${w.txHash}`} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] no-underline text-[10px]">
                      TX: {w.txHash.slice(0, 8)}...
                    </a>
                  </>
                )}
              </div>
              <div className={`text-right text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${statusColor(w.status)} justify-self-end`}>
                {w.status}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
