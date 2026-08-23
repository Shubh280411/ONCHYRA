'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl } from '@/lib/utils';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast, ToastComponent } = useToast();
  const router = useRouter();

  async function handleLogin() {
    if (!email || !password) {
      showToast('Enter email and password', 'error');
      return;
    }
    setLoading(true);
    try {
      const auth = getClientAuth();
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/check`, {
        headers: { 'x-auth-uid': uid },
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.admin) {
        showToast('Access denied. Not an admin.', 'error');
        setLoading(false);
        return;
      }

      showToast('Welcome, Admin!');
      router.push('/admin');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#070816]">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] rounded-full bg-[#6d28d9]/40 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-[#2563eb]/40 blur-[120px]" />
      </div>

      <div className="w-[360px] p-10 rounded-[18px] bg-white/5 border border-white/10 text-center">
        <h1 className="font-[family-name:var(--font-manrope)] text-3xl font-extrabold mb-5 bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] bg-clip-text text-transparent">
          ONCHYRA ADMIN
        </h1>

        <input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3.5 mt-3 rounded-[10px] border-none bg-white/8 text-white text-sm outline-none placeholder:text-white/30"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          className="w-full p-3.5 mt-3 rounded-[10px] border-none bg-white/8 text-white text-sm outline-none placeholder:text-white/30"
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full mt-5 p-3.5 rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] text-[#0b0b20] font-bold cursor-pointer disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="mt-3 text-xs opacity-60">Authorized admins only</div>
      </div>
      {ToastComponent}
    </div>
  );
}
