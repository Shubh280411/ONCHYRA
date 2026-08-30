'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl } from '@/lib/utils';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

interface Withdrawal {
  id: string;
  address: string;
  amount: number;
  status: string;
  tx_hash: string | null;
  created_at: number;
  completed_at: number | null;
}

export default function OnxWithdrawalPage() {
  const { uid } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const apiUrl = detectApiUrl();

  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [onxBalance, setOnxBalance] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<Withdrawal[]>([]);

  useEffect(() => {
    if (!uid) return;
    const base = apiUrl || '';
    Promise.all([
      fetch(`${base}/api/onx/status?uid=${uid}`).then(r => r.json()),
      fetch(`${base}/api/user/${uid}`).then(r => r.json()),
      fetch(`${base}/api/onx/withdraw?uid=${uid}`).then(r => r.json()),
    ]).then(([status, user, wd]) => {
      setOnxBalance(status.balance || 0);
      setEmail(user.email || '');
      setHistory(wd.withdrawals || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [uid, apiUrl]);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setInterval(() => setOtpCooldown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [otpCooldown]);

  async function sendOtp() {
    if (!email || otpCooldown > 0) return;
    const base = apiUrl || '';
    try {
      const res = await fetch(`${base}/api/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'withdrawal' }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setOtpCooldown(30);
        showToast('OTP sent to your email', 'success');
      } else {
        showToast(data.error || 'Failed to send OTP', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  }

  async function handleWithdraw() {
    if (!uid || !address || !amount || !otp) return;
    setSubmitting(true);
    const base = apiUrl || '';
    try {
      const res = await fetch(`${base}/api/onx/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, address, amount: Number(amount), otp, email }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Withdrawal successful', 'success');
        setOnxBalance(data.newBalance);
        setAddress('');
        setAmount('');
        setOtp('');
        setOtpSent(false);
        fetch(`${base}/api/onx/withdraw?uid=${uid}`).then(r => r.json()).then(wd => {
          setHistory(wd.withdrawals || []);
        }).catch(() => {});
      } else {
        showToast(data.error || 'Withdrawal failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
    setSubmitting(false);
  }

  const MIN = 25;
  const numAmount = Number(amount) || 0;
  const isValidAmount = numAmount >= MIN && numAmount <= onxBalance;

  if (loading) {
    return (
      <div style={{ padding: 15, overflowX: 'hidden' }}>
        <div className="onxwd-bg" />
        <div style={{ maxWidth: 480, margin: '0 auto', paddingTop: 60, textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.05)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Loading...</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 15, overflowX: 'hidden', fontFamily: INTER }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .onxwd-bg{position:fixed;top:-10%;left:-10%;width:120%;height:120%;background:radial-gradient(circle at 20% 30%,#8b5cf633,transparent 40%),radial-gradient(circle at 80% 70%,#6366f133,transparent 40%);z-index:-1}
        .onxwd-inner{max-width:480px;margin:0 auto}
        .onxwd-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:18px;margin-bottom:12px}
        .onxwd-label{font-size:10px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px}
        .onxwd-input{width:100%;padding:11px 13px;border-radius:11px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:#fff;font-size:13px;font-family:${INTER};outline:none;box-sizing:border-box;transition:border-color 0.2s}
        .onxwd-input:focus{border-color:#8b5cf6}
        .onxwd-input::placeholder{color:rgba(255,255,255,0.2)}
        .onxwd-btn{width:100%;padding:12px;border:none;border-radius:11px;font-size:13px;font-weight:700;cursor:pointer;font-family:${INTER};transition:all 0.2s}
        .onxwd-btn.primary{background:linear-gradient(135deg,#8b5cf6,#6366f1);color:#fff}
        .onxwd-btn.primary:hover{box-shadow:0 4px 20px rgba(139,92,246,0.3);transform:translateY(-1px)}
        .onxwd-btn.primary:disabled{opacity:0.4;cursor:not-allowed;transform:none;box-shadow:none}
        .onxwd-btn.secondary{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.5);border:1px solid rgba(255,255,255,0.08)}
        .onxwd-btn.secondary:hover{background:rgba(255,255,255,0.08)}
        .onxwd-quick{display:inline-flex;padding:5px 10px;border-radius:8px;background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.15);color:#8b5cf6;font-size:10px;font-weight:700;cursor:pointer;transition:0.2s}
        .onxwd-quick:hover{background:rgba(139,92,246,0.15)}
        .onxwd-tx{font-size:10px;color:rgba(255,255,255,0.25);word-break:break-all;font-family:monospace}
        .onxwd-info-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
        .onxwd-info-row:last-child{border-bottom:none}
        .onxwd-info-key{font-size:11px;color:rgba(255,255,255,0.4)}
        .onxwd-info-val{font-size:11px;color:#fff;font-weight:600;word-break:break-all;text-align:right;max-width:60%}
        @media(min-width:600px){
          .onxwd-inner{max-width:520px}
          .onxwd-card{padding:22px}
        }
      `}</style>
      <div className="onxwd-bg" />
      <div className="onxwd-inner">
        {ToastComponent}

        {/* Header */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <img src="/ONX-logo.png" alt="ONX" style={{ width: 22, height: 22, borderRadius: 5 }} />
            <span style={{ fontFamily: SG, fontWeight: 900, fontSize: 17, background: 'linear-gradient(135deg,#8b5cf6,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ONX Withdrawal
            </span>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Instant automatic withdrawal to any Polygon wallet</div>
        </div>

        {/* Balance + Token Info */}
        <div className="onxwd-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <img src="/ONX-logo.png" alt="ONX" style={{ width: 32, height: 32, borderRadius: 8 }} />
            <div>
              <div style={{ fontFamily: SG, fontWeight: 800, fontSize: 20, color: '#8b5cf6' }}>{onxBalance.toFixed(2)}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>ONX Available</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
            <div className="onxwd-info-row">
              <span className="onxwd-info-key">Token</span>
              <span className="onxwd-info-val" style={{ color: '#8b5cf6' }}>ONX (Polygon)</span>
            </div>
            <div className="onxwd-info-row">
              <span className="onxwd-info-key">Contract</span>
              <span className="onxwd-info-val" style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>0x57D7...6C72</span>
            </div>
            <div className="onxwd-info-row">
              <span className="onxwd-info-key">Network</span>
              <span className="onxwd-info-val">Polygon (PoS)</span>
            </div>
            <div className="onxwd-info-row">
              <span className="onxwd-info-key">Min Withdrawal</span>
              <span className="onxwd-info-val">25 ONX</span>
            </div>
            <div className="onxwd-info-row">
              <span className="onxwd-info-key">Processing</span>
              <span className="onxwd-info-val" style={{ color: '#22c55e' }}>Instant / Auto</span>
            </div>
          </div>
        </div>

        {/* Withdraw Form */}
        <div className="onxwd-card">
          <div className="onxwd-label">Wallet Address</div>
          <input
            className="onxwd-input"
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="0x... Polygon wallet address"
            spellCheck={false}
            style={{ marginBottom: 12 }}
          />

          <div className="onxwd-label">Amount (ONX)</div>
          <input
            className="onxwd-input"
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder={`Min ${MIN} ONX`}
            min={MIN}
            max={onxBalance}
            style={{ marginBottom: 6 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Min: {MIN} ONX</div>
            {numAmount > 0 && !isValidAmount && (
              <div style={{ fontSize: 10, color: '#ef4444' }}>
                {numAmount < MIN ? `Min ${MIN} ONX` : 'Insufficient balance'}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {[25, 50, 100].filter(v => v <= onxBalance).map(v => (
              <button key={v} className="onxwd-quick" onClick={() => setAmount(String(v))}>{v}</button>
            ))}
            {onxBalance > MIN && (
              <button className="onxwd-quick" onClick={() => setAmount(String(Math.floor(onxBalance)))}>MAX</button>
            )}
          </div>

          <div className="onxwd-label">OTP Verification</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 6 }}>
            Code sent to {email || 'your email'}
          </div>
          <input
            className="onxwd-input"
            type="text"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit OTP"
            maxLength={6}
            style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, letterSpacing: 3, marginBottom: 8 }}
          />
          <button
            className="onxwd-btn secondary"
            disabled={otpCooldown > 0 || !email}
            onClick={sendOtp}
            style={{ marginBottom: 14, fontSize: 11, padding: 10 }}
          >
            {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : otpSent ? 'Resend OTP' : 'Send OTP'}
          </button>

          <button
            className="onxwd-btn primary"
            disabled={!address || address.length !== 42 || !isValidAmount || !otp || otp.length !== 6 || submitting}
            onClick={handleWithdraw}
          >
            {submitting ? 'Processing...' : `Withdraw ${numAmount > 0 ? numAmount + ' ONX' : ''}`}
          </button>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="onxwd-card">
            <div style={{ fontFamily: SG, fontWeight: 800, fontSize: 13, marginBottom: 10, color: 'rgba(255,255,255,0.5)' }}>Recent Withdrawals</div>
            {history.slice(0, 5).map((w) => (
              <div key={w.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#8b5cf6' }}>-{w.amount} ONX</span>
                  <span style={{ fontSize: 9, padding: '3px 8px', borderRadius: 6, background: w.status === 'completed' ? 'rgba(34,197,94,0.1)' : w.status === 'failed' ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.1)', color: w.status === 'completed' ? '#22c55e' : w.status === 'failed' ? '#ef4444' : '#fbbf24', fontWeight: 700, textTransform: 'uppercase' }}>
                    {w.status}
                  </span>
                </div>
                <div className="onxwd-tx">{w.address}</div>
                {w.tx_hash && (
                  <a href={`https://polygonscan.com/tx/${w.tx_hash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: '#60a5fa', textDecoration: 'none', display: 'inline-block', marginTop: 2 }}>
                    View on Polygonscan ↗
                  </a>
                )}
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>
                  {w.created_at ? new Date(w.created_at).toLocaleString() : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
