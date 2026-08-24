'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl } from '@/lib/utils';
import Loading from '@/components/ui/Loading';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

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
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'searching' | 'found' | 'error'>('idle');
  const [lookupText, setLookupText] = useState('Type a referral code to search');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lookupTimeout, setLookupTimeoutState] = useState<ReturnType<typeof setTimeout> | null>(null);

  const amountNum = useMemo(() => parseFloat(amount) || 0, [amount]);
  const burn = useMemo(() => amountNum * 0.1, [amountNum]);
  const receive = useMemo(() => amountNum - burn, [amountNum, burn]);

  const canSend = uid && recipientId && amountNum >= 1 && amountNum <= 500 && amountNum <= balance;

  const loadData = useCallback(async () => {
    try {
      const userRes = await fetch(`${apiUrl}/api/user/${uid}`);
      if (userRes.ok) {
        const d = await userRes.json();
        setBalance(Number(d.balance) || 0);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [apiUrl, uid]);

  const lookupRecipient = useCallback(async (code: string) => {
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
      setLookupStatus('found');
      setLookupText('Recipient verified');
    } catch {
      setLookupStatus('error');
      setLookupText('Network ID not found');
    }
  }, [apiUrl, uid]);

  useEffect(() => {
    if (!uid) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    return () => { if (lookupTimeout) clearTimeout(lookupTimeout); };
  }, [uid, loadData, lookupTimeout]);

  function handleRecipientChange(val: string) {
    if (lookupTimeout) clearTimeout(lookupTimeout);
    setRecipientCode(val);
    setRecipientId(null);
    setRecipientName('');
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

  async function sendTransfer() {
    if (!canSend || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${apiUrl}/api/transfer/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUid: uid, referralCode: recipientCode.trim().toUpperCase(), amount: amountNum }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transfer failed');
      showToast(`Sent ${receive.toFixed(2)} ONC to ${recipientName}`);
      setBalance(prev => prev - amountNum);
      setAmount('');
      setRecipientCode('');
      setNote('');
      setRecipientId(null);
      setRecipientName('');
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

  function clearForm() {
    setAmount('');
    setNote('');
    setRecipientCode('');
    setRecipientId(null);
    setRecipientName('');
    setLookupStatus('idle');
    setLookupText('Type a referral code to search');
  }

  if (loading) return <Loading text="Securing channel..." />;

  return (
    <div style={{ fontFamily: INTER, background: '#03040a', color: 'white', minHeight: '100vh', padding: '20px 16px', maxWidth: 420, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {ToastComponent}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '12px 16px' }}>
        <Link href="/dashboard" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', textDecoration: 'none', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        </Link>
        <span style={{ fontFamily: SG, fontWeight: 900, fontSize: 18, background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', flex: 1 }}>ONCHYRA</span>
        <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.25)', letterSpacing: 1 }}>P2P</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 100, fontSize: 9, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#a78bfa' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 8px #a78bfa' }} />
          P2P TRANSFER
        </div>
        <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 12 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 23c-4.97 0-9-3.58-9-8 0-3.07 2.25-5.74 3.84-7.54C8.29 5.86 9.5 4.2 9.5 2c0 0 1.5 1 3 3.5C14 8 15 10 15 12c0-1 1-3 3-4.5.5 1.5.5 3.5.5 5.5 0 5.52-2.91 10-6.5 10z" fill="rgba(251,191,36,0.15)" />
            <path d="M12 20c-2.76 0-5-2.24-5-5 0-2.15 1.65-3.86 2.5-4.8.8-1.06 1.5-2.2 1.5-3.7 0 0 0.8 1.1 1.5 2.7.7 1.6 1.5 3.2 1.5 4.8 0-0.7 0.7-2 2.5-3.2.3 0.9.3 2 0.3 3.2 0 3.31-2.02 6-4.8 6z" fill="#fbbf24" opacity="0.9" />
          </svg>
        </div>
      </div>

      <h1 style={{ fontFamily: SG, fontWeight: 800, fontSize: 30, letterSpacing: -0.5, lineHeight: 1.1, marginTop: -2 }}>Send ONC</h1>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 100, padding: '8px 18px', fontSize: 13, fontWeight: 600, width: 'fit-content' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        Balance <span style={{ fontFamily: SG, fontWeight: 800, background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 16 }}>{balance.toFixed(2)}</span> ONC
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 28, padding: '24px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle at 30% 20%, rgba(167,139,250,0.03) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: '15%', width: '70%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.2), rgba(96,165,250,0.3), transparent)' }} />

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.5)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 16, height: 2, background: '#a78bfa', borderRadius: 2, boxShadow: '0 0 8px rgba(167,139,250,0.3)' }} />
            Recipient Network ID
          </div>
          <input type="text" value={recipientCode} onChange={e => handleRecipientChange(e.target.value)} placeholder="Enter referral code" maxLength={12} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '15px 16px', fontFamily: INTER, fontSize: 15, color: 'white', outline: 'none', boxSizing: 'border-box' }} />
          {recipientId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12, padding: '14px 16px', background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 16 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: SG, fontWeight: 800, fontSize: 18, color: 'white' }}>{recipientName.charAt(0).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{recipientName}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2, fontFamily: 'monospace', letterSpacing: 1 }}>{recipientCode}</div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
            </div>
          )}
          <div style={{ fontSize: 10, fontWeight: 600, marginTop: 8, minHeight: 18, display: 'flex', alignItems: 'center', gap: 6, color: lookupStatus === 'found' ? '#22c55e' : lookupStatus === 'error' ? '#f87171' : lookupStatus === 'searching' ? '#60a5fa' : 'rgba(255,255,255,0.2)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            {lookupText}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.5)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 16, height: 2, background: '#a78bfa', borderRadius: 2, boxShadow: '0 0 8px rgba(167,139,250,0.3)' }} />
            Amount
          </div>
          <input type="text" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="Minimum 1 ONC" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '15px 16px', fontFamily: INTER, fontSize: 15, color: 'white', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.5)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 16, height: 2, background: '#a78bfa', borderRadius: 2, boxShadow: '0 0 8px rgba(167,139,250,0.3)' }} />
            Note <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400, letterSpacing: 0 }}>(optional)</span>
          </div>
          <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="What's this for?" maxLength={100} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '15px 16px', fontFamily: INTER, fontSize: 15, color: 'white', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginTop: 18, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', fontSize: 13 }}>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              Total Amount
            </span>
            <span style={{ fontWeight: 700, fontFamily: SG, color: '#60a5fa' }}>{amountNum.toFixed(2)} ONC</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', fontSize: 13 }}>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              10% Network Burn
            </span>
            <span style={{ fontWeight: 700, fontFamily: SG, color: '#f472b6' }}>{burn.toFixed(2)} ONC</span>
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '7px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', fontSize: 13 }}>
            <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
              Receivable Amount
            </span>
            <span style={{ fontWeight: 800, fontFamily: SG, fontSize: 17, color: '#22c55e' }}>{receive.toFixed(2)} ONC</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.2)' }}>Max / Tx</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', marginTop: 2 }}>500 ONC</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.2)' }}>Daily Limit</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f472b6', marginTop: 2 }}>3 / 24h</div>
          </div>
        </div>

        <button onClick={sendTransfer} disabled={!canSend || sending} style={{ marginTop: 22, width: '100%', padding: 18, border: 'none', borderRadius: 18, background: canSend && !sending ? 'linear-gradient(135deg, #a78bfa, #60a5fa)' : '#1a1a1a', color: canSend && !sending ? '#000' : '#444', fontFamily: SG, fontSize: 14, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' as const, cursor: canSend && !sending ? 'pointer' : 'not-allowed', boxShadow: canSend && !sending ? '0 4px 30px rgba(167,139,250,0.25)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          {sending ? 'Processing...' : 'Send ONC'}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.25)', padding: '8px 0 4px' }}>
        <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Dashboard
        </Link>
        <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
        <button onClick={setMax} style={{ color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: INTER }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
          Max
        </button>
        <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
        <button onClick={clearForm} style={{ color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: INTER }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Clear
        </button>
      </div>

      <div style={{ textAlign: 'center', padding: '28px 16px', color: 'rgba(255,255,255,0.2)', fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3 }}>
          <circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
        </svg>
        No transfers yet
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}
