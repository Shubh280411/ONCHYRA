'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase';
import { useToast } from '@/components/ui/Toast';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

export default function LoginPage() {
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [banned, setBanned] = useState<{ isBanned: boolean; reason: string; uid: string } | null>(null);
  const [appealSent, setAppealSent] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealLoading, setAppealLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('Enter your email and password', 'error');
      return;
    }
    setLoading(true);
    try {
      const auth = getClientAuth();
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      const res = await fetch('/api/user/' + uid);
      const userData = await res.json();
      if (userData.banned) {
        setBanned({ isBanned: true, reason: userData.ban_reason || 'No reason provided', uid });
        setLoading(false);
        return;
      }
      router.push('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
      setLoading(false);
    }
  };

  const handleAppeal = async () => {
    if (!appealReason.trim()) { showToast('Please enter a reason', 'error'); return; }
    setAppealLoading(true);
    try {
      const res = await fetch('/api/ban-appeal', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: banned?.uid, reason: appealReason }),
      });
      const data = await res.json();
      if (data.success) { setAppealSent(true); showToast('Appeal submitted'); }
      else showToast(data.error || 'Failed', 'error');
    } catch { showToast('Failed', 'error'); }
    setAppealLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) { showToast('Enter your email first', 'error'); return; }
    try {
      const auth = getClientAuth();
      await sendPasswordResetEmail(auth, email);
      showToast('Password reset email sent. Check spam folder.');
    } catch (err: any) { showToast(err.message || 'Reset failed', 'error'); }
  };

  return (
    <div style={{ fontFamily: INTER, background: '#03040a', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes float{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-20px) scale(1.05)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes pulseGlow{0%,100%{opacity:0.4}50%{opacity:0.8}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* Background Orbs */}
      <div style={{ position: 'absolute', top: '15%', left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12), transparent 70%)', filter: 'blur(60px)', animation: 'float 8s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.1), transparent 70%)', filter: 'blur(60px)', animation: 'float 10s ease-in-out infinite 2s', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '60%', left: '50%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.06), transparent 70%)', filter: 'blur(50px)', animation: 'float 12s ease-in-out infinite 4s', pointerEvents: 'none' }} />

      {/* Grid pattern */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 0, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32, animation: 'fadeUp 0.6s ease' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <img src="/omchyra-logo.png" alt="ONCHYRA" style={{ height: 48 }} />
          </div>
          <div style={{ fontFamily: SG, fontSize: 20, fontWeight: 900, background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 2, marginBottom: 10 }}>ONCHYRA</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: 4, fontWeight: 600 }}>Welcome Back</div>
        </div>

        {/* Main Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 28,
          padding: '36px 32px',
          backdropFilter: 'blur(40px)',
          animation: 'fadeUp 0.7s ease',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontFamily: SG, fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Sign In</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Access your mining dashboard</div>
          </div>

          {/* Email Input */}
          <div style={{ marginBottom: 16, animation: 'fadeUp 0.8s ease' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              Email Address
            </div>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"
              style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, fontFamily: INTER, outline: 'none', transition: 'all 0.3s', boxSizing: 'border-box' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(139,92,246,0.1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: 20, animation: 'fadeUp 0.9s ease' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Password
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" autoComplete="current-password"
                style={{ width: '100%', padding: '14px 48px 14px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, fontFamily: INTER, outline: 'none', transition: 'all 0.3s', boxSizing: 'border-box' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(139,92,246,0.1)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} tabIndex={-1} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: 4, display: 'flex', transition: '0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showPass ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                </svg>
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button onClick={handleLogin} disabled={loading} style={{
            width: '100%', padding: 16, borderRadius: 14, border: 'none',
            background: loading ? 'rgba(139,92,246,0.3)' : 'linear-gradient(135deg, #8b5cf6, #60a5fa)',
            color: '#fff', fontFamily: SG, fontWeight: 900, fontSize: 14, letterSpacing: 0.5,
            cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s',
            boxShadow: loading ? 'none' : '0 8px 30px rgba(139,92,246,0.3)',
            animation: 'fadeUp 1s ease',
          }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(139,92,246,0.4)'; } }}
            onMouseLeave={e => { if (!loading) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(139,92,246,0.3)'; } }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>

          {/* Forgot Password */}
          <div onClick={handleResetPassword} style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: '0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#a78bfa'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}>
            Forgot Password?
          </div>
        </div>

        {/* Ban Modal */}
        {banned && (
          <div style={{ marginTop: 16, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 20, padding: '28px 24px', textAlign: 'center', animation: 'fadeUp 0.4s ease' }}>
            {!appealSent ? (
              <>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                </div>
                <div style={{ fontFamily: SG, fontSize: 18, fontWeight: 800, color: '#ef4444', marginBottom: 6 }}>Account Banned</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Your account has been suspended.</div>
                <div style={{ fontSize: 11, color: 'rgba(239,68,68,0.6)', marginBottom: 20, fontStyle: 'italic' }}>Reason: {banned.reason}</div>
                <textarea value={appealReason} onChange={e => setAppealReason(e.target.value)} placeholder="Why should we unban you?"
                  style={{ width: '100%', minHeight: 80, padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: 12, outline: 'none', resize: 'vertical', fontFamily: INTER, marginBottom: 14, boxSizing: 'border-box' }} />
                <button onClick={handleAppeal} disabled={appealLoading} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #60a5fa)', color: '#fff', fontWeight: 800, fontSize: 12, cursor: appealLoading ? 'not-allowed' : 'pointer', fontFamily: INTER, opacity: appealLoading ? 0.5 : 1 }}>
                  {appealLoading ? 'Submitting...' : 'Submit Appeal'}
                </button>
              </>
            ) : (
              <>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div style={{ fontFamily: SG, fontSize: 18, fontWeight: 800, color: '#22c55e', marginBottom: 6 }}>Appeal Submitted</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Our team will review it shortly.</div>
              </>
            )}
          </div>
        )}

        {/* Register Link */}
        <Link href="/register" style={{ display: 'block', marginTop: 24, textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: '0.2s', animation: 'fadeUp 1.1s ease' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#a78bfa'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}>
          Don&apos;t have an account? <span style={{ color: '#a78bfa', fontWeight: 700 }}>Create Account</span>
        </Link>
      </div>
      {ToastComponent}
    </div>
  );
}
