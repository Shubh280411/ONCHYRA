'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase';
import { useToast } from '@/components/ui/Toast';

export default function LoginPage() {
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('Enter your email and password', 'error');
      return;
    }
    setLoading(true);
    try {
      const auth = getClientAuth();
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      showToast('Enter your email first', 'error');
      return;
    }
    try {
      const auth = getClientAuth();
      await sendPasswordResetEmail(auth, email);
      showToast('Password reset email sent. Check spam folder.');
    } catch (err: any) {
      showToast(err.message || 'Reset failed', 'error');
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        background: '#03040a',
        color: 'white',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.08) 0%, transparent 60%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <img src="/logo.png" alt="ONCHYRA" style={{ height: 36, verticalAlign: 'middle' }} />
        </div>
        <div
          style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.2)',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: 3,
            marginTop: 2,
          }}
        >
          Welcome Back
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 24,
            padding: '32px 28px',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>Login</div>
          <div
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.25)',
              textAlign: 'center',
              marginBottom: 20,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Access your account
          </div>

          <div style={{ position: 'relative', marginTop: 14 }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              autoComplete="email"
              style={{
                width: '100%',
                padding: '16px 18px',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: 'white',
                fontSize: 13,
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
                transition: '0.25s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(167,139,250,0.35)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
            />
          </div>

          <div style={{ position: 'relative', marginTop: 14 }}>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '16px 18px',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: 'white',
                fontSize: 13,
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
                transition: '0.25s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(167,139,250,0.35)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              tabIndex={-1}
              style={{
                position: 'absolute',
                right: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.3)',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                transition: '0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {showPass ? (
                  <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  </>
                ) : (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              marginTop: 16,
              padding: 16,
              border: 'none',
              borderRadius: 14,
              background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
              color: '#000',
              fontWeight: 900,
              fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Inter', sans-serif",
              transition: '0.25s',
              letterSpacing: '0.3px',
              opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.opacity = '0.9';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'none';
              }
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div
            style={{
              display: 'block',
              marginTop: 18,
              textAlign: 'center',
              fontSize: 12,
              color: 'rgba(255,255,255,0.25)',
              textDecoration: 'none',
              transition: '0.2s',
              cursor: 'pointer',
            }}
            onClick={handleResetPassword}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#a78bfa'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; }}
          >
            Forgot Password?
          </div>
        </div>

        <Link
          href="/register"
          style={{
            display: 'block',
            marginTop: 6,
            textAlign: 'center',
            fontSize: 12,
            color: 'rgba(255,255,255,0.25)',
            textDecoration: 'none',
            transition: '0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#a78bfa'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; }}
        >
          No account? <span style={{ color: '#a78bfa', fontWeight: 700 }}>Register</span>
        </Link>
      </div>
      {ToastComponent}
    </div>
  );
}
