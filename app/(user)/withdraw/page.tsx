'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl, formatUSD } from '@/lib/utils';
import type { Withdrawal } from '@/types';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

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
    } catch {}
  }

  async function fetchHistory() {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/withdrawals/${uid}`);
      if (res.ok) {
        setHistory(await res.json());
      }
    } catch {}
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

  function statusStyle(s: string): React.CSSProperties {
    if (s === 'completed') return { color: '#22c55e', background: 'rgba(34,197,94,0.08)' };
    if (s === 'pending') return { color: '#f59e0b', background: 'rgba(245,158,11,0.08)' };
    if (s === 'processing') return { color: '#a78bfa', background: 'rgba(167,139,250,0.08)' };
    return { color: '#ef4444', background: 'rgba(239,68,68,0.08)' };
  }

  return (
    <div style={{ fontFamily: INTER, background: '#03040a', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px', backgroundImage: 'radial-gradient(ellipse at 50% 0%,rgba(167,139,250,0.06) 0%,transparent 60%)' }}>
      {ToastComponent}

      <style>{`
        @keyframes slideUp{from{transform:translateX(-50%) translateY(20px);opacity:0}}
        @keyframes blink-warn{0%,100%{opacity:1;border-color:rgba(239,68,68,0.2)}50%{opacity:0.6;border-color:rgba(239,68,68,0.5)}}
        @keyframes loaderAnim{0%,80%,100%{opacity:.2;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* phone-frame */}
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 22, padding: '14px 16px' }}>
          <Link href="/dashboard" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, cursor: 'pointer', color: 'white', textDecoration: 'none', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          </Link>
          <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 18, background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', flex: 1 }}>ONCHYRA</div>
          <div style={{ fontSize: 11, fontWeight: 700, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.15)', padding: '6px 14px', borderRadius: 100, whiteSpace: 'nowrap' as const }}>
            Commission <span style={{ fontFamily: SG, color: '#a78bfa' }}>{formatUSD(balance)}</span>
          </div>
        </div>

        {/* page title */}
        <div>
          <div style={{ fontFamily: SG, fontWeight: 800, fontSize: 22, margin: '4px 0 2px' }}>Withdraw</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>BEP20 — Min $10 | 5% fee</div>
        </div>

        {/* summary card */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '16px 12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div style={{ textAlign: 'center', padding: 8 }}>
              <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 15, color: '#fff' }}>{formatUSD(balance)}</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginTop: 4 }}>Commission</div>
            </div>
            <div style={{ textAlign: 'center', padding: 8 }}>
              <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 15, color: '#22c55e' }}>{formatUSD(totalWithdrawn)}</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginTop: 4 }}>Withdrawn</div>
            </div>
            <div style={{ textAlign: 'center', padding: 8 }}>
              <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 15, color: '#f59e0b' }}>{formatUSD(pendingTotal)}</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginTop: 4 }}>Pending</div>
            </div>
          </div>
        </div>

        {/* form card */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '24px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, color: 'rgba(255,255,255,0.25)', marginBottom: 16 }}>Withdrawal Request</div>

          {/* network badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.12)', borderRadius: 12, marginBottom: 14, fontSize: 12 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#26a17b"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>Network: <strong style={{ color: '#a78bfa' }}>BEP20</strong> &bull; Asset: <strong style={{ color: '#a78bfa' }}>USDT</strong></span>
          </div>

          {/* warning card */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', marginTop: 12, marginBottom: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, fontSize: 11, lineHeight: 1.5, color: 'rgba(255,255,255,0.6)', animation: 'blink-warn 2s ease-in-out infinite' }}>
            <svg style={{ flexShrink: 0, marginTop: 1, color: '#ef4444' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span><strong style={{ color: '#ef4444' }}>Verify your wallet address carefully.</strong> Funds sent to a wrong address cannot be recovered. Double-check before submitting.</span>
          </div>

          {/* wallet address */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, color: 'rgba(255,255,255,0.3)', marginBottom: 5 }}>Wallet Address</label>
            <input type="text" value={wallet} onChange={e => setWallet(e.target.value)} placeholder="0x..." style={{ width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: 'white', fontSize: 14, fontFamily: INTER, outline: 'none', transition: '0.2s' }} />
          </div>

          {/* amount */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, color: 'rgba(255,255,255,0.3)', marginBottom: 5 }}>Amount (USDT)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="10" min="10" step="0.01" style={{ width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: 'white', fontSize: 14, fontFamily: INTER, outline: 'none', transition: '0.2s' }} />
          </div>

          {/* fee calc */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>Amount</span>
            <span style={{ fontWeight: 700, fontFamily: SG }}>{formatUSD(amountNum)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>Fee (5%)</span>
            <span style={{ fontWeight: 700, fontFamily: SG, color: '#ef4444' }}>{formatUSD(fee)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: 'none', fontSize: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>You Receive</span>
            <span style={{ fontWeight: 700, fontFamily: SG, color: '#22c55e' }}>{formatUSD(receive)}</span>
          </div>

          {/* send OTP */}
          {!otpSent ? (
            <button onClick={sendOtp} disabled={!canSendOtp || sendingOtp} style={{ width: '100%', marginTop: 12, padding: 16, border: 'none', borderRadius: 14, background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', color: '#000', fontWeight: 900, fontSize: 13, cursor: 'pointer', fontFamily: INTER, transition: '0.25s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (!canSendOtp || sendingOtp) ? 0.5 : 1 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2 2"/><polyline points="22,6 12,13 2,6"/></svg>
              {sendingOtp ? 'Sending...' : 'Send OTP'}
            </button>
          ) : (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} inputMode="numeric" autoComplete="one-time-code" style={{ flex: 1, padding: '14px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: 20, fontWeight: 900, fontFamily: SG, textAlign: 'center', letterSpacing: 6, outline: 'none', transition: '0.2s' }} />
                {!otpVerified && (
                  <button onClick={verifyOtp} disabled={otp.length !== 6} style={{ padding: '10px 18px', border: 'none', borderRadius: 14, background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', color: '#000', fontWeight: 900, fontSize: 11, cursor: 'pointer', fontFamily: INTER, transition: '0.25s', whiteSpace: 'nowrap' as const, opacity: otp.length !== 6 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Verify
                  </button>
                )}
              </div>
              {otpVerified && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#22c55e', textAlign: 'center', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  OTP Verified
                </div>
              )}
            </div>
          )}

          {/* withdraw button */}
          {otpVerified && (
            <button onClick={submitWithdraw} disabled={submitting} style={{ width: '100%', marginTop: 12, padding: 16, border: 'none', borderRadius: 14, background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', color: '#000', fontWeight: 900, fontSize: 13, cursor: 'pointer', fontFamily: INTER, transition: '0.25s', opacity: submitting ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              {submitting ? 'Processing...' : 'Withdraw'}
            </button>
          )}

          {/* rules */}
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, marginTop: 12 }}>
            <strong style={{ color: 'rgba(255,255,255,0.5)' }}>Rules:</strong> Min $10 &bull; 5% fee deducted ($10-$50 auto-send, &gt;$50 needs admin approval)<br />
            Insufficient balance or invalid address will be rejected.
          </div>
        </div>

        {/* history card */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Withdrawal History
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)' }}>{history.length}</div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 32, gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a78bfa', animation: 'loaderAnim 1s ease-in-out infinite' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a78bfa', animation: 'loaderAnim 1s ease-in-out infinite 0.2s' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a78bfa', animation: 'loaderAnim 1s ease-in-out infinite 0.4s' }} />
            </div>
          ) : history.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>No withdrawals yet</div>
          ) : (
            history.map((w) => {
              const netAmount = (Number(w.amount) || 0) - (Number(w.fee) || 0);
              const date = new Date(w.createdAt).toLocaleDateString();
              const ss = statusStyle(w.status);
              return (
                <div key={w.id} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 80px', gap: 8, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center' }}>
                  <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 14 }}>{formatUSD(Number(w.amount) || 0)}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', lineHeight: 1.3 }}>
                    Fee: {formatUSD(Number(w.fee) || 0)} &bull; Net: {formatUSD(netAmount)}<br />
                    {date}
                    {w.txHash && (
                      <>
                        <br />
                        <a href={`https://bscscan.com/tx/${w.txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa', textDecoration: 'none', fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          TX: {w.txHash.slice(0, 8)}...
                        </a>
                      </>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' as const, padding: '4px 10px', borderRadius: 100, display: 'inline-block', justifySelf: 'end', ...ss }}>{w.status}</div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
