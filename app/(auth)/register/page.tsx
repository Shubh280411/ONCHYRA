'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl } from '@/lib/utils';
import Loading from '@/components/ui/Loading';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast, ToastComponent } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referral, setReferral] = useState('');
  const [otp, setOtp] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [registering, setRegistering] = useState(false);

  const [resendTimer, setResendTimer] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [refError, setRefError] = useState(false);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setReferral(ref.toUpperCase());
  }, [searchParams]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const apiUrl = detectApiUrl();

  const validateForm = useCallback(() => {
    const n = name.trim();
    const e = email.trim();
    const p = password;
    const r = referral.trim().toUpperCase();

    if (!n || !e || !p) {
      showToast('Please fill in all fields', 'error');
      return null;
    }
    if (e.includes('+')) {
      showToast('Email aliases (+) are not allowed', 'error');
      return null;
    }
    if (!r) {
      setRefError(true);
      setTimeout(() => setRefError(false), 2000);
      showToast('Referral code is required', 'error');
      return null;
    }
    return { name: n, email: e, password: p, refCode: r };
  }, [name, email, password, referral, showToast]);

  const handleSendOtp = async () => {
    const data = validateForm();
    if (!data) return;

    setSendingOtp(true);
    try {
      const res = await fetch(`${apiUrl}/api/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });
      const bodyText = await res.text();
      let result: any;
      try { result = JSON.parse(bodyText); } catch { throw new Error(`Status ${res.status}: ${bodyText.slice(0, 120)}`); }
      if (!res.ok) throw new Error(result.error || 'Request failed');

      showToast('Verification email sent successfully to your email address.');
      setOtpSent(true);
      setResendTimer(60);
      setTimeout(() => setShowAlert(true), 500);
    } catch (err: any) {
      showToast(err.message || 'Failed to send OTP', 'error');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    const data = validateForm();
    if (!data) return;

    setResendTimer(60);
    try {
      const res = await fetch(`${apiUrl}/api/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });
      const bodyText = await res.text();
      let result: any;
      try { result = JSON.parse(bodyText); } catch { throw new Error(`Status ${res.status}`); }
      if (!res.ok) throw new Error(result.error || 'Request failed');
      showToast('OTP resent successfully');
    } catch (err: any) {
      showToast(err.message || 'Failed to resend OTP', 'error');
      setResendTimer(0);
    }
  };

  const handleRegister = async () => {
    const data = validateForm();
    if (!data) return;

    const o = otp.trim();
    if (!o || o.length !== 6) {
      showToast('Enter the 6-digit OTP', 'error');
      return;
    }

    setRegistering(true);
    try {
      // Step 1 — Verify OTP
      const vRes = await fetch(`${apiUrl}/api/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, otp: o }),
      });
      const vData = await vRes.json();
      if (!vRes.ok) throw new Error(vData.error || 'OTP verification failed');
      setOtpVerified(true);

      // Step 2 — Check referral
      const refRes = await fetch(`${apiUrl}/api/check-referral/${data.refCode}`);
      if (!refRes.ok) {
        const e = await refRes.json();
        throw new Error(e.error || 'Referral check failed');
      }
      const refData = await refRes.json();
      if (!refData.valid) {
        showToast('Invalid referral code', 'error');
        setRegistering(false);
        return;
      }

      // Step 3 — Create Firebase user
      const auth = getClientAuth();
      const userCred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const uid = userCred.user.uid;
      const myRefCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Step 4 — Register commission
      const commRes = await fetch(`${apiUrl}/api/register-commission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          name: data.name,
          email: data.email,
          referralCode: myRefCode,
          referredBy: data.refCode,
        }),
      });

      if (!commRes.ok) {
        const commErr = await commRes.json();
        console.error('Commission error:', commErr);
        showToast('Registration done but bonus processing failed. Contact support.', 'error');
      }

      showToast('Registration Successful!');
      setTimeout(() => router.push('/dashboard'), 800);
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setRegistering(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    fontFamily: 'Inter',
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
        <div
          className="text-center font-black text-[22px] tracking-[-0.5px]"
          style={{
            fontFamily: 'Space Grotesk',
            background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          <img src="/logo.png" alt="ONCHYRA" className="h-8 inline-block align-middle mr-1.5" />
          ONCHYRA
        </div>
        <div
          className="text-center uppercase tracking-[3px] text-[10px]"
          style={{ color: 'rgba(255,255,255,0.2)', marginTop: '2px' }}
        >
          Create Your Account
        </div>

        <div
          className="rounded-3xl p-8"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="text-center text-[15px] font-extrabold mb-1">Get Started</div>
          <div
            className="text-center text-[10px] uppercase tracking-[1px] mb-5"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            Join the mining revolution
          </div>

          {/* Name */}
          <div className="relative mt-3.5">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              autoComplete="name"
              className="w-full py-4 px-[18px] rounded-[14px] text-white text-[13px] outline-none transition-all duration-250"
              style={inputStyle}
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

          {/* Email */}
          <div className="relative mt-3.5">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              autoComplete="email"
              className="w-full py-4 px-[18px] rounded-[14px] text-white text-[13px] outline-none transition-all duration-250"
              style={inputStyle}
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

          {/* Password */}
          <div className="relative mt-3.5">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="new-password"
              className="w-full py-4 px-[18px] rounded-[14px] text-white text-[13px] outline-none transition-all duration-250 pr-12"
              style={inputStyle}
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
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                ) : (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          </div>

          {/* Referral */}
          <div className="relative mt-3.5">
            <input
              type="text"
              value={referral}
              onChange={(e) => setReferral(e.target.value)}
              placeholder="Referral Code *"
              autoComplete="off"
              className="w-full py-4 px-[18px] rounded-[14px] text-white text-[13px] outline-none transition-all duration-250"
              style={{
                ...inputStyle,
                borderColor: refError ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(167,139,250,0.35)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = refError ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
            />
          </div>

          {/* Ref badge */}
          <div
            className="flex items-center gap-2 mt-3.5 py-3 px-4 rounded-xl"
            style={{
              background: 'rgba(167,139,250,0.06)',
              border: '1px solid rgba(167,139,250,0.12)',
            }}
          >
            <svg width="16" height="16" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span className="text-[11px] leading-[1.4]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Referral code is <strong style={{ color: '#a78bfa' }}>required</strong> — you must have an inviter to join
            </span>
          </div>

          {/* OTP Row */}
          {otpSent && (
            <div className="flex gap-2 mt-3.5 animate-fade-in">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="flex-1 py-4 px-[18px] rounded-[14px] text-white text-[20px] font-black outline-none transition-all duration-250 text-center tracking-[6px]"
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                  fontFamily: 'Space Grotesk',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(167,139,250,0.35)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                }}
              />
            </div>
          )}

          {/* Help text */}
          {otpSent && (
            <div className="mt-1.5 text-center text-[10px] animate-fade-in" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Can&apos;t find the email?{' '}
              <span
                className="font-semibold cursor-pointer"
                style={{ color: '#a78bfa' }}
                onClick={() => setShowAlert(true)}
              >
                Check Spam/Junk folder
              </span>{' '}
              first.
            </div>
          )}

          {/* Notice box */}
          {otpSent && (
            <div
              className="mt-3.5 p-4 rounded-[14px] text-[11px] leading-[1.7] animate-fade-in"
              style={{
                background: 'rgba(167,139,250,0.06)',
                border: '1px solid rgba(167,139,250,0.12)',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              <div className="font-extrabold text-[12px] mb-1.5" style={{ color: '#a78bfa' }}>
                OTP not received?
              </div>
              Please check your <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Spam/Junk folder</strong>. Some email providers may place verification emails there.
              <br /><br />
              If you find the email in Spam, mark it as <strong style={{ color: 'rgba(255,255,255,0.8)' }}>&quot;Not Spam&quot;</strong> to ensure future ONCHYRA emails arrive in your inbox.
            </div>
          )}

          {/* Resend area */}
          {otpSent && (
            <div className="mt-2.5 text-center min-h-[20px]">
              {resendTimer > 0 ? (
                <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Resend OTP in {resendTimer}s
                </span>
              ) : (
                <button
                  onClick={handleResendOtp}
                  className="font-bold text-[12px] py-1.5 px-3 rounded-lg transition-all duration-200"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#a78bfa',
                    cursor: 'pointer',
                    fontFamily: 'Inter',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(167,139,250,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  Resend OTP
                </button>
              )}
            </div>
          )}

          {/* Register button */}
          {otpSent && (
            <button
              onClick={handleRegister}
              disabled={registering}
              className="w-full mt-4 py-4 rounded-[14px] text-black font-black text-[13px] transition-all duration-250 animate-fade-in"
              style={{
                background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                border: 'none',
                cursor: registering ? 'not-allowed' : 'pointer',
                opacity: registering ? 0.5 : 1,
                fontFamily: 'Inter',
                letterSpacing: '0.3px',
              }}
            >
              {registering ? 'Verifying...' : 'Create Account'}
            </button>
          )}

          {/* Send OTP button */}
          {!otpSent && (
            <button
              onClick={handleSendOtp}
              disabled={sendingOtp}
              className="w-full mt-4 py-4 rounded-[14px] text-black font-black text-[13px] transition-all duration-250"
              style={{
                background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                border: 'none',
                cursor: sendingOtp ? 'not-allowed' : 'pointer',
                opacity: sendingOtp ? 0.5 : 1,
                fontFamily: 'Inter',
                letterSpacing: '0.3px',
              }}
            >
              {sendingOtp ? 'Sending...' : 'Send OTP'}
            </button>
          )}
        </div>

        <Link
          href="/login"
          className="block mt-1.5 text-center text-xs no-underline transition-colors duration-200"
          style={{ color: 'rgba(255,255,255,0.25)' }}
        >
          Already have an account? <span style={{ color: '#a78bfa', fontWeight: 700 }}>Login</span>
        </Link>
      </div>

      {/* Alert overlay */}
      {showAlert && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-6 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShowAlert(false)}
        >
          <div
            className="max-w-[360px] w-full text-center rounded-3xl p-8"
            style={{
              background: '#0b0b20',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[36px] mb-2.5">⚠️</div>
            <div className="font-extrabold text-[15px] mb-2">Check Your Spam Folder</div>
            <div
              className="text-xs leading-[1.7] mb-[18px]"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Your verification email may appear in the{' '}
              <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Spam/Junk folder</strong>.
              <br /><br />
              Please check{' '}
              <strong style={{ color: 'rgba(255,255,255,0.8)' }}>all folders</strong> before requesting another OTP.
            </div>
            <button
              onClick={() => setShowAlert(false)}
              className="w-full py-3 px-6 rounded-xl font-extrabold text-[13px]"
              style={{
                background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Inter',
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {ToastComponent}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RegisterContent />
    </Suspense>
  );
}
