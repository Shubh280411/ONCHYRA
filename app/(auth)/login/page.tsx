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
      className="min-h-screen flex items-center justify-center p-5"
      style={{
        background: '#03040a',
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.08) 0%, transparent 60%)',
      }}
    >
      <div className="w-full max-w-[420px] flex flex-col gap-4">
        <div className="text-center">
          <img src="/logo.png" alt="ONCHYRA" className="h-9 inline-block align-middle" />
        </div>
        <div
          className="text-center uppercase tracking-[3px] text-[10px]"
          style={{ color: 'rgba(255,255,255,0.2)' }}
        >
          Welcome Back
        </div>

        <div
          className="rounded-3xl p-8"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="text-center text-[15px] font-extrabold mb-1">Login</div>
          <div
            className="text-center text-[10px] uppercase tracking-[1px] mb-5"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            Access your account
          </div>

          <div className="relative mt-3.5">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              autoComplete="email"
              className="w-full py-4 px-[18px] rounded-[14px] text-white text-[13px] outline-none transition-all duration-250"
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                fontFamily: 'Inter',
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

          <div className="relative mt-3.5">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full py-4 px-[18px] rounded-[14px] text-white text-[13px] outline-none transition-all duration-250 pr-12"
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                fontFamily: 'Inter',
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
              className="absolute right-3.5 top-1/2 -translate-y-1/2 flex p-1 transition-colors duration-200"
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
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
            className="w-full mt-4 py-4 rounded-[14px] text-black font-black text-[13px] transition-all duration-250"
            style={{
              background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              fontFamily: 'Inter',
              letterSpacing: '0.3px',
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div
            className="block mt-[18px] text-center text-xs cursor-pointer transition-colors duration-200"
            style={{ color: 'rgba(255,255,255,0.25)' }}
            onClick={handleResetPassword}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#a78bfa'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; }}
          >
            Forgot Password?
          </div>
        </div>

        <Link
          href="/register"
          className="block mt-1.5 text-center text-xs no-underline transition-colors duration-200"
          style={{ color: 'rgba(255,255,255,0.25)' }}
        >
          No account? <span style={{ color: '#a78bfa', fontWeight: 700 }}>Register</span>
        </Link>
      </div>
      {ToastComponent}
    </div>
  );
}
