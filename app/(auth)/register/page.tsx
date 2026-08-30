'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl } from '@/lib/utils';
import Loading from '@/components/ui/Loading';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

const COUNTRIES = [
  { code: 'IN', name: 'India', flag: '\uD83C\uDDEE\uD83C\uDDF3' },
  { code: 'US', name: 'United States', flag: '\uD83C\uDDFA\uD83C\uDDF8' },
  { code: 'GB', name: 'United Kingdom', flag: '\uD83C\uDDEC\uD83C\uDDE7' },
  { code: 'CA', name: 'Canada', flag: '\uD83C\uDDE8\uD83C\uDDE6' },
  { code: 'AU', name: 'Australia', flag: '\uD83C\uDDE6\uD83C\uDDFA' },
  { code: 'DE', name: 'Germany', flag: '\uD83C\uDDE9\uD83C\uDDEA' },
  { code: 'FR', name: 'France', flag: '\uD83C\uDDEB\uD83C\uDDF7' },
  { code: 'JP', name: 'Japan', flag: '\uD83C\uDDEF\uD83C\uDDF5' },
  { code: 'CN', name: 'China', flag: '\uD83C\uDDE8\uD83C\uDDF3' },
  { code: 'BR', name: 'Brazil', flag: '\uD83C\uDDE7\uD83C\uDDF7' },
  { code: 'RU', name: 'Russia', flag: '\uD83C\uDDF7\uD83C\uDDFA' },
  { code: 'KR', name: 'South Korea', flag: '\uD83C\uDDF0\uD83C\uDDF7' },
  { code: 'NG', name: 'Nigeria', flag: '\uD83C\uDDF3\uD83C\uDDEC' },
  { code: 'ZA', name: 'South Africa', flag: '\uD83C\uDDFF\uD83C\uDDE6' },
  { code: 'AE', name: 'UAE', flag: '\uD83C\uDDE6\uD83C\uDDEA' },
  { code: 'SA', name: 'Saudi Arabia', flag: '\uD83C\uDDF8\uD83C\uDDE6' },
  { code: 'PK', name: 'Pakistan', flag: '\uD83C\uDDF5\uD83C\uDDF0' },
  { code: 'BD', name: 'Bangladesh', flag: '\uD83C\uDDE7\uD83C\uDDE9' },
  { code: 'PH', name: 'Philippines', flag: '\uD83C\uDDF5\uD83C\uDDED' },
  { code: 'ID', name: 'Indonesia', flag: '\uD83C\uDDEE\uD83C\uDDE9' },
  { code: 'MY', name: 'Malaysia', flag: '\uD83C\uDDF2\uD83C\uDDFE' },
  { code: 'TH', name: 'Thailand', flag: '\uD83C\uDDF9\uD83C\uDDED' },
  { code: 'VN', name: 'Vietnam', flag: '\uD83C\uDDFB\uD83C\uDDF3' },
  { code: 'TR', name: 'Turkey', flag: '\uD83C\uDDF9\uD83C\uDDF7' },
  { code: 'EG', name: 'Egypt', flag: '\uD83C\uDDEA\uD83C\uDDEC' },
  { code: 'KE', name: 'Kenya', flag: '\uD83C\uDDF0\uD83C\uDDEA' },
  { code: 'GH', name: 'Ghana', flag: '\uD83C\uDDEC\uD83C\uDDED' },
  { code: 'MX', name: 'Mexico', flag: '\uD83C\uDDF2\uD83C\uDDFD' },
  { code: 'IT', name: 'Italy', flag: '\uD83C\uDDEE\uD83C\uDDF9' },
  { code: 'ES', name: 'Spain', flag: '\uD83C\uDDEA\uD83C\uDDF8' },
  { code: 'NL', name: 'Netherlands', flag: '\uD83C\uDDF3\uD83C\uDDF1' },
  { code: 'SE', name: 'Sweden', flag: '\uD83C\uDDF8\uD83C\uDDEA' },
  { code: 'PL', name: 'Poland', flag: '\uD83C\uDDF5\uD83C\uDDF1' },
  { code: 'AR', name: 'Argentina', flag: '\uD83C\uDDE6\uD83C\uDDF7' },
  { code: 'CO', name: 'Colombia', flag: '\uD83C\uDDE8\uD83C\uDDF4' },
  { code: 'CL', name: 'Chile', flag: '\uD83C\uDDE8\uD83C\uDDF1' },
  { code: 'PE', name: 'Peru', flag: '\uD83C\uDDF5\uD83C\uDDEA' },
  { code: 'NP', name: 'Nepal', flag: '\uD83C\uDDF3\uD83C\uDDF5' },
  { code: 'LK', name: 'Sri Lanka', flag: '\uD83C\uDDF1\uD83C\uDDF0' },
  { code: 'MM', name: 'Myanmar', flag: '\uD83C\uDDF2\uD83C\uDDF2' },
  { code: 'SG', name: 'Singapore', flag: '\uD83C\uDDF8\uD83C\uDDEC' },
  { code: 'NZ', name: 'New Zealand', flag: '\uD83C\uDDF3\uD83C\uDDFF' },
  { code: 'IE', name: 'Ireland', flag: '\uD83C\uDDEE\uD83C\uDDEA' },
  { code: 'PT', name: 'Portugal', flag: '\uD83C\uDDF5\uD83C\uDDF9' },
  { code: 'GR', name: 'Greece', flag: '\uD83C\uDDEC\uD83C\uDDF7' },
  { code: 'IL', name: 'Israel', flag: '\uD83C\uDDEE\uD83C\uDDF1' },
  { code: 'UA', name: 'Ukraine', flag: '\uD83C\uDDFA\uD83C\uDDE6' },
  { code: 'ET', name: 'Ethiopia', flag: '\uD83C\uDDEA\uD83C\uDDF9' },
  { code: 'TZ', name: 'Tanzania', flag: '\uD83C\uDDF9\uD83C\uDDFF' },
  { code: 'UG', name: 'Uganda', flag: '\uD83C\uDDFA\uD83C\uDDEC' },
];

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast, ToastComponent } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referral, setReferral] = useState('');
  const [country, setCountry] = useState('');
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
    const t = setInterval(() => setResendTimer(p => p <= 1 ? 0 : p - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const apiUrl = detectApiUrl();

  const validateForm = useCallback(() => {
    const n = name.trim(), e = email.trim(), p = password, r = referral.trim().toUpperCase();
    if (!n || !e || !p) { showToast('Please fill in all fields', 'error'); return null; }
    if (e.includes('+')) { showToast('Email aliases (+) are not allowed', 'error'); return null; }
    if (!r) { setRefError(true); setTimeout(() => setRefError(false), 2000); showToast('Referral code is required', 'error'); return null; }
    if (!country) { showToast('Please select your country', 'error'); return null; }
    return { name: n, email: e, password: p, refCode: r, country };
  }, [name, email, password, referral, country, showToast]);

  const handleSendOtp = async () => {
    const data = validateForm();
    if (!data) return;
    setSendingOtp(true);
    try {
      const res = await fetch(`${apiUrl}/api/otp/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: data.email }) });
      const bodyText = await res.text();
      let result: any; try { result = JSON.parse(bodyText); } catch { throw new Error(`Status ${res.status}`); }
      if (!res.ok) throw new Error(result.error || 'Request failed');
      showToast('Verification email sent!');
      setOtpSent(true);
      setResendTimer(60);
      setTimeout(() => setShowAlert(true), 500);
    } catch (err: any) { showToast(err.message || 'Failed to send OTP', 'error'); }
    setSendingOtp(false);
  };

  const handleResendOtp = async () => {
    const data = validateForm();
    if (!data) return;
    setResendTimer(60);
    try {
      const res = await fetch(`${apiUrl}/api/otp/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: data.email }) });
      const bodyText = await res.text();
      let result: any; try { result = JSON.parse(bodyText); } catch { throw new Error(`Status ${res.status}`); }
      if (!res.ok) throw new Error(result.error || 'Request failed');
      showToast('OTP resent!');
    } catch (err: any) { showToast(err.message || 'Failed', 'error'); setResendTimer(0); }
  };

  const handleRegister = async () => {
    const data = validateForm();
    if (!data) return;
    const o = otp.trim();
    if (!o || o.length !== 6) { showToast('Enter the 6-digit OTP', 'error'); return; }
    setRegistering(true);
    try {
      const vRes = await fetch(`${apiUrl}/api/otp/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: data.email, otp: o }) });
      const vData = await vRes.json();
      if (!vRes.ok) throw new Error(vData.error || 'OTP verification failed');
      setOtpVerified(true);

      const refRes = await fetch(`${apiUrl}/api/check-referral/${data.refCode}`);
      if (!refRes.ok) throw new Error('Referral check failed');
      const refData = await refRes.json();
      if (!refData.valid) { showToast('Invalid referral code', 'error'); setRegistering(false); return; }

      const auth = getClientAuth();
      const userCred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const uid = userCred.user.uid;
      const myRefCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      await fetch(`${apiUrl}/api/register-commission`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, name: data.name, email: data.email, referralCode: myRefCode, referredBy: data.refCode, country: data.country }),
      });
      showToast('Welcome to ONCHYRA!');
      setTimeout(() => router.push('/dashboard'), 800);
    } catch (err: any) { showToast(err.message || 'Registration failed', 'error'); }
    setRegistering(false);
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '14px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, fontFamily: INTER, outline: 'none', transition: 'all 0.3s', boxSizing: 'border-box' };
  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(139,92,246,0.1)'; };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = refError ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.boxShadow = 'none'; };
  const selectFocus = (e: React.FocusEvent<HTMLSelectElement>) => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(139,92,246,0.1)'; };
  const selectBlur = (e: React.FocusEvent<HTMLSelectElement>) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.boxShadow = 'none'; };

  const step1Done = name && email && password && referral;
  const step2Done = otpSent;

  return (
    <div style={{ fontFamily: INTER, background: '#03040a', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes float{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-20px) scale(1.05)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 20px rgba(139,92,246,0.2)}50%{box-shadow:0 0 40px rgba(139,92,246,0.4)}}
      `}</style>

      {/* Background Orbs */}
      <div style={{ position: 'absolute', top: '10%', right: '15%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12), transparent 70%)', filter: 'blur(60px)', animation: 'float 9s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '15%', left: '5%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.1), transparent 70%)', filter: 'blur(60px)', animation: 'float 11s ease-in-out infinite 3s', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '50%', left: '60%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.06), transparent 70%)', filter: 'blur(50px)', animation: 'float 13s ease-in-out infinite 5s', pointerEvents: 'none' }} />

      {/* Grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 0, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28, animation: 'fadeUp 0.6s ease' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <img src="/omchyra-logo.png" alt="ONCHYRA" style={{ height: 48 }} />
          </div>
          <div style={{ fontFamily: SG, fontSize: 20, fontWeight: 900, background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 2, marginBottom: 10 }}>ONCHYRA</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: 4, fontWeight: 600 }}>Create Account</div>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, padding: '0 20px', animation: 'fadeUp 0.7s ease' }}>
          {[
            { step: 1, label: 'Details', done: step1Done },
            { step: 2, label: 'Verify', done: step2Done },
            { step: 3, label: 'Done', done: otpVerified },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, transition: '0.3s',
                background: s.done ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(255,255,255,0.06)',
                border: s.done ? 'none' : '1px solid rgba(255,255,255,0.08)',
                color: s.done ? '#fff' : 'rgba(255,255,255,0.3)',
              }}>
                {s.done ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> : s.step}
              </div>
              <div style={{ fontSize: 9, color: s.done ? '#22c55e' : 'rgba(255,255,255,0.25)', fontWeight: 600, letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Main Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 28,
          padding: '32px 28px',
          backdropFilter: 'blur(40px)',
          animation: 'fadeUp 0.8s ease',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontFamily: SG, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Get Started</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Join the mining revolution</div>
          </div>

          {/* Full Name */}
          <div style={{ marginBottom: 14, animation: 'fadeUp 0.9s ease' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Full Name
            </div>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" autoComplete="name" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
          </div>

          {/* Email */}
          <div style={{ marginBottom: 14, animation: 'fadeUp 1s ease' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              Email Address
            </div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 14, animation: 'fadeUp 1.1s ease' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Password
            </div>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" autoComplete="new-password" style={{ ...inputStyle, paddingRight: 48 }} onFocus={inputFocus} onBlur={inputBlur} />
              <button type="button" onClick={() => setShowPass(!showPass)} tabIndex={-1} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: 4, display: 'flex', transition: '0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showPass ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                </svg>
              </button>
            </div>
          </div>

          {/* Referral Code */}
          <div style={{ marginBottom: 14, animation: 'fadeUp 1.2s ease' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              Referral Code *
            </div>
            <input type="text" value={referral} onChange={e => setReferral(e.target.value)} placeholder="Enter inviter code" autoComplete="off"
              style={{ ...inputStyle, borderColor: refError ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.06)' }}
              onFocus={inputFocus} onBlur={inputBlur} />
          </div>

          {/* Country */}
          <div style={{ marginBottom: 14, animation: 'fadeUp 1.25s ease' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              Country *
            </div>
            <div style={{ position: 'relative' }}>
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                style={{
                  ...inputStyle,
                  appearance: 'none',
                  cursor: 'pointer',
                  color: country ? '#fff' : 'rgba(255,255,255,0.3)',
                  paddingRight: 36,
                }}
                onFocus={selectFocus}
                onBlur={selectBlur}
              >
                <option value="" disabled>Select your country</option>
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code} style={{ background: '#0b0b20', color: '#fff' }}>{c.flag} {c.name}</option>
                ))}
              </select>
              <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(255,255,255,0.3)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          </div>

          {/* Referral Notice */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)', marginBottom: 16, animation: 'fadeUp 1.3s ease' }}>
            <svg width="14" height="14" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
              Referral code is <strong style={{ color: '#8b5cf6' }}>required</strong> — you must have an inviter to join
            </span>
          </div>

          {/* OTP Input */}
          {otpSent && (
            <div style={{ marginBottom: 14, animation: 'fadeUp 0.4s ease' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Verification Code
              </div>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000" maxLength={6} inputMode="numeric" autoComplete="one-time-code"
                style={{ ...inputStyle, fontSize: 22, fontWeight: 800, fontFamily: SG, textAlign: 'center', letterSpacing: 8, padding: '16px 18px' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(139,92,246,0.1)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = 'none'; }} />
            </div>
          )}

          {/* OTP Tips */}
          {otpSent && (
            <div style={{ marginBottom: 14, padding: 14, borderRadius: 12, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)', fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, animation: 'fadeUp 0.5s ease' }}>
              <div style={{ fontWeight: 800, fontSize: 12, color: '#8b5cf6', marginBottom: 4 }}>Check Spam/Junk folder</div>
              Verification emails may land in spam. Mark as &quot;Not Spam&quot; for future emails.
            </div>
          )}

          {/* Resend Timer */}
          {otpSent && (
            <div style={{ textAlign: 'center', marginBottom: 14, minHeight: 20, animation: 'fadeUp 0.55s ease' }}>
              {resendTimer > 0 ? (
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Resend OTP in {resendTimer}s</span>
              ) : (
                <button onClick={handleResendOtp} style={{ background: 'none', border: 'none', color: '#8b5cf6', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: INTER, padding: '6px 12px', borderRadius: 8, transition: '0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>
                  Resend OTP
                </button>
              )}
            </div>
          )}

          {/* Register Button */}
          {!otpSent ? (
            <button onClick={handleSendOtp} disabled={sendingOtp} style={{
              width: '100%', padding: 16, borderRadius: 14, border: 'none',
              background: sendingOtp ? 'rgba(139,92,246,0.3)' : 'linear-gradient(135deg, #8b5cf6, #60a5fa)',
              color: '#fff', fontFamily: SG, fontWeight: 900, fontSize: 14, letterSpacing: 0.5,
              cursor: sendingOtp ? 'not-allowed' : 'pointer', transition: 'all 0.3s',
              boxShadow: sendingOtp ? 'none' : '0 8px 30px rgba(139,92,246,0.3)',
              animation: 'fadeUp 1.4s ease',
            }}
              onMouseEnter={e => { if (!sendingOtp) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(139,92,246,0.4)'; } }}
              onMouseLeave={e => { if (!sendingOtp) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(139,92,246,0.3)'; } }}>
              {sendingOtp ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Sending...
                </span>
              ) : 'Send Verification Code'}
            </button>
          ) : (
            <button onClick={handleRegister} disabled={registering} style={{
              width: '100%', padding: 16, borderRadius: 14, border: 'none',
              background: registering ? 'rgba(139,92,246,0.3)' : 'linear-gradient(135deg, #8b5cf6, #60a5fa)',
              color: '#fff', fontFamily: SG, fontWeight: 900, fontSize: 14, letterSpacing: 0.5,
              cursor: registering ? 'not-allowed' : 'pointer', transition: 'all 0.3s',
              boxShadow: registering ? 'none' : '0 8px 30px rgba(139,92,246,0.3)',
              animation: 'fadeUp 0.5s ease',
            }}
              onMouseEnter={e => { if (!registering) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(139,92,246,0.4)'; } }}
              onMouseLeave={e => { if (!registering) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(139,92,246,0.3)'; } }}>
              {registering ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Creating Account...
                </span>
              ) : 'Create Account'}
            </button>
          )}
        </div>

        {/* Login Link */}
        <Link href="/login" style={{ display: 'block', marginTop: 24, textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: '0.2s', animation: 'fadeUp 1.5s ease' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#a78bfa'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}>
          Already have an account? <span style={{ color: '#a78bfa', fontWeight: 700 }}>Sign In</span>
        </Link>
      </div>

      {/* Spam Alert Modal */}
      {showAlert && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setShowAlert(false)}>
          <div style={{ background: '#0b0b20', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, padding: '32px 24px', maxWidth: 360, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div style={{ fontFamily: SG, fontWeight: 800, fontSize: 16, marginBottom: 8 }}>Check Spam Folder</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 18 }}>
              Your verification email may appear in the <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Spam/Junk folder</strong>. Please check all folders before requesting another OTP.
            </div>
            <button onClick={() => setShowAlert(false)} style={{ padding: '12px 24px', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #8b5cf6, #60a5fa)', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: INTER, width: '100%' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
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
  return <Suspense fallback={<Loading />}><RegisterContent /></Suspense>;
}
