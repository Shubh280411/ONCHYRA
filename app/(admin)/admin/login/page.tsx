'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase';
import { detectApiUrl } from '@/lib/utils';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);
  const router = useRouter();

  function showToast(msg: string, error = false) { setToast({ msg, error }); setTimeout(() => setToast(null), 3000); }

  async function handleLogin() {
    if (!email || !password) { showToast('Enter email and password', true); return; }
    setLoading(true);
    try {
      const auth = getClientAuth();
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/check`, { headers: { 'x-auth-uid': uid } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.admin) { showToast('Access denied. Not an admin.', true); setLoading(false); return; }
      showToast('Welcome, Admin!');
      router.push('/admin');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Login failed', true);
    } finally { setLoading(false); }
  }

  const SvgLock = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
  const SvgUser = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
  const SvgKey = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', background: '#070816', fontFamily: "'Inter', sans-serif" }}>
      {/* Background gradients */}
      <div style={{ position: 'absolute', inset: 0, zIndex: -1 }}>
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(109,40,217,0.4)', filter: 'blur(120px)' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(37,99,235,0.4)', filter: 'blur(120px)' }} />
      </div>

      <div style={{ width: 360, padding: 40, borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
        {/* Logo */}
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SvgLock />
          </div>
        </div>

        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 800, marginBottom: 24, background: 'linear-gradient(90deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ONCHYRA ADMIN
        </h1>

        <div style={{ position: 'relative', marginBottom: 12 }}>
          <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}><SvgUser /></div>
          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '14px 14px 14px 40px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.08)', color: 'white', fontSize: 14, outline: 'none', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' as const }}
          />
        </div>

        <div style={{ position: 'relative', marginBottom: 12 }}>
          <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}><SvgKey /></div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%', padding: '14px 14px 14px 40px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.08)', color: 'white', fontSize: 14, outline: 'none', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' as const }}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: '100%', marginTop: 8, padding: '14px 0', borderRadius: 12, background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', border: 'none', color: '#0b0b20', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, fontFamily: "'Inter', sans-serif", transition: 'opacity 0.2s' }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0b0b20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Logging in...
            </span>
          ) : 'Login'}
        </button>

        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.6, color: 'rgba(255,255,255,0.6)' }}>Authorized admins only</div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '14px 24px', borderRadius: 14, fontWeight: 700, fontSize: 13, boxShadow: '0 10px 30px rgba(0,0,0,0.4)', background: toast.error ? 'rgba(239,68,68,0.9)' : 'rgba(34,197,94,0.9)', color: 'white', border: `1px solid ${toast.error ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}` }}>
          {toast.msg}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
