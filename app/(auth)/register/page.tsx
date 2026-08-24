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
      const vRes = await fetch(`${apiUrl}/api/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, otp: o }),
      });
      const vData = await vRes.json();
      if (!vRes.ok) throw new Error(vData.error || 'OTP verification failed');
      setOtpVerified(true);

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

      const auth = getClientAuth();
      const userCred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const uid = userCred.user.uid;
      const myRefCode = Math.random().toString(36).substring(2, 8).toUpperCase();

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
  };

  const inputFocusHandler = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(167,139,250,0.35)';
    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
  };

  const inputBlurHandler = (e: React.FocusEvent<HTMLInputElement>, refBorderColor?: string) => {
    e.currentTarget.style.borderColor = refError && refBorderColor === 'referral'
      ? 'rgba(239,68,68,0.4)'
      : 'rgba(255,255,255,0.08)';
    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
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
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 900,
            fontSize: 22,
            background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
            letterSpacing: -0.5,
          }}
        >
          <img src="/logo.png" alt="ONCHYRA" style={{ height: 32, verticalAlign: 'middle', marginRight: 6 }} />
          ONCHYRA
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
          Create Your Account
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
          <div style={{ fontSize: 15, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>Get Started</div>
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
            Join the mining revolution
          </div>

          <div style={{ position: 'relative', marginTop: 14 }}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              autoComplete="name"
              style={inputStyle}
              onFocus={inputFocusHandler}
              onBlur={(e) => inputBlurHandler(e)}
            />
          </div>

          <div style={{ position: 'relative', marginTop: 14 }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              autoComplete="email"
              style={inputStyle}
              onFocus={inputFocusHandler}
              onBlur={(e) => inputBlurHandler(e)}
            />
          </div>

          <div style={{ position: 'relative', marginTop: 14 }}>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="new-password"
              style={{ ...inputStyle, paddingRight: 48 }}
              onFocus={inputFocusHandler}
              onBlur={(e) => inputBlurHandler(e)}
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

          <div style={{ position: 'relative', marginTop: 14 }}>
            <input
              type="text"
              value={referral}
              onChange={(e) => setReferral(e.target.value)}
              placeholder="Referral Code *"
              autoComplete="off"
              style={{
                ...inputStyle,
                borderColor: refError ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)',
              }}
              onFocus={inputFocusHandler}
              onBlur={(e) => inputBlurHandler(e, 'referral')}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 14,
              padding: '12px 16px',
              borderRadius: 12,
              background: 'rgba(167,139,250,0.06)',
              border: '1px solid rgba(167,139,250,0.12)',
            }}
          >
            <svg width="16" height="16" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
              Referral code is <strong style={{ color: '#a78bfa' }}>required</strong> — you must have an inviter to join
            </span>
          </div>

          {otpSent && (
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                style={{
                  flex: 1,
                  padding: '16px 18px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'white',
                  fontSize: 20,
                  fontWeight: 900,
                  fontFamily: "'Space Grotesk', sans-serif",
                  outline: 'none',
                  transition: '0.25s',
                  textAlign: 'center',
                  letterSpacing: 6,
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

          {otpSent && (
            <div style={{ marginTop: 6, fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
              Can&apos;t find the email?{' '}
              <span
                style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => setShowAlert(true)}
              >
                Check Spam/Junk folder
              </span>{' '}
              first.
            </div>
          )}

          {otpSent && (
            <div
              style={{
                marginTop: 14,
                padding: 16,
                borderRadius: 14,
                background: 'rgba(167,139,250,0.06)',
                border: '1px solid rgba(167,139,250,0.12)',
                fontSize: 11,
                color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.7,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 12, color: '#a78bfa', marginBottom: 6 }}>
                OTP not received?
              </div>
              Please check your <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Spam/Junk folder</strong>. Some email providers may place verification emails there.
              <br /><br />
              If you find the email in Spam, mark it as <strong style={{ color: 'rgba(255,255,255,0.8)' }}>&quot;Not Spam&quot;</strong> to ensure future ONCHYRA emails arrive in your inbox.
            </div>
          )}

          {otpSent && (
            <div style={{ marginTop: 10, textAlign: 'center', minHeight: 20 }}>
              {resendTimer > 0 ? (
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                  Resend OTP in {resendTimer}s
                </span>
              ) : (
                <button
                  onClick={handleResendOtp}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#a78bfa',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    padding: '6px 12px',
                    borderRadius: 8,
                    transition: '0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(167,139,250,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  Resend OTP
                </button>
              )}
            </div>
          )}

          {otpSent && (
            <button
              onClick={handleRegister}
              disabled={registering}
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
                cursor: registering ? 'not-allowed' : 'pointer',
                fontFamily: "'Inter', sans-serif",
                transition: '0.25s',
                letterSpacing: '0.3px',
                opacity: registering ? 0.5 : 1,
                transform: 'none',
              }}
              onMouseEnter={(e) => {
                if (!registering) {
                  e.currentTarget.style.opacity = '0.9';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!registering) {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'none';
                }
              }}
            >
              {registering ? 'Verifying...' : 'Create Account'}
            </button>
          )}

          {!otpSent && (
            <button
              onClick={handleSendOtp}
              disabled={sendingOtp}
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
                cursor: sendingOtp ? 'not-allowed' : 'pointer',
                fontFamily: "'Inter', sans-serif",
                transition: '0.25s',
                letterSpacing: '0.3px',
                opacity: sendingOtp ? 0.5 : 1,
                transform: 'none',
              }}
              onMouseEnter={(e) => {
                if (!sendingOtp) {
                  e.currentTarget.style.opacity = '0.9';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!sendingOtp) {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'none';
                }
              }}
            >
              {sendingOtp ? 'Sending...' : 'Send OTP'}
            </button>
          )}
        </div>

        <Link
          href="/login"
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
          Already have an account? <span style={{ color: '#a78bfa', fontWeight: 700 }}>Login</span>
        </Link>
      </div>

      {showAlert && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setShowAlert(false)}
        >
          <div
            style={{
              background: '#0b0b20',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 24,
              padding: '32px 24px',
              maxWidth: 360,
              width: '100%',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8 }}>Check Your Spam Folder</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 18 }}>
              Your verification email may appear in the{' '}
              <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Spam/Junk folder</strong>.
              <br /><br />
              Please check{' '}
              <strong style={{ color: 'rgba(255,255,255,0.8)' }}>all folders</strong> before requesting another OTP.
            </div>
            <button
              onClick={() => setShowAlert(false)}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                color: '#000',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                width: '100%',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
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
