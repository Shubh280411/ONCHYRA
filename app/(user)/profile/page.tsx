'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl, formatUSD } from '@/lib/utils';
import { getAuth, signOut } from 'firebase/auth';
import Loading from '@/components/ui/Loading';

interface UserData {
  name: string;
  email: string;
  referralCode: string;
  balance: number;
  commissionBalance: number;
  totalPackageSpend: number;
  totalCommissions: number;
  refLevel1: number;
  refLevel2: number;
  refLevel3: number;
  activePackage: string;
  rank: string;
  streakDays: number;
  createdAt: number;
}

export default function ProfilePage() {
  const { uid } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const apiUrl = detectApiUrl();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    loadData();
  }, [uid]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/user/${uid}`);
      if (res.ok) setUserData(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }

  async function logout() {
    try {
      const auth = getAuth();
      await signOut(auth);
      localStorage.removeItem('onc_uid');
      window.location.href = '/login';
    } catch {
      showToast('Failed to log out', 'error');
    }
  }

  if (loading) return <Loading text="Loading profile..." />;

  return (
    <div className="min-h-screen px-4 py-5 max-w-md mx-auto flex flex-col gap-3.5">
      {ToastComponent}

      {/* Header */}
      <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3.5">
        <Link href="/dashboard" className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06] text-white shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
        </Link>
        <span className="font-[family-name:var(--font-space-grotesk)] font-black text-lg bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent flex-1">
          ONCHYRA
        </span>
        <div className="w-9" />
      </div>

      {/* Avatar + Name */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center mx-auto mb-4 font-[family-name:var(--font-space-grotesk)] font-black text-3xl text-white">
          {(userData?.name || 'U').charAt(0).toUpperCase()}
        </div>
        <h2 className="font-[family-name:var(--font-space-grotesk)] font-extrabold text-xl">{userData?.name || 'User'}</h2>
        <p className="text-xs text-white/40 mt-1">{userData?.email || ''}</p>
        {userData?.rank && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/15 rounded-full text-[10px] font-bold text-[var(--primary)] uppercase">
            {userData.rank}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
        <div className="text-[10px] font-extrabold text-white/30 uppercase tracking-wider mb-2">Account Stats</div>
        <div className="space-y-0">
          <div className="flex justify-between items-center py-3 border-b border-white/[0.03] text-xs">
            <span className="text-white/40 flex items-center gap-2">
              <svg width="14" height="14" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
              Wallet Balance
            </span>
            <span className="font-bold font-[family-name:var(--font-space-grotesk)]">{formatUSD(userData?.balance || 0)}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-white/[0.03] text-xs">
            <span className="text-white/40 flex items-center gap-2">
              <svg width="14" height="14" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
              Commission Balance
            </span>
            <span className="font-bold font-[family-name:var(--font-space-grotesk)] text-green-400">{formatUSD(userData?.commissionBalance || 0)}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-white/[0.03] text-xs">
            <span className="text-white/40 flex items-center gap-2">
              <svg width="14" height="14" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              Total Commissions
            </span>
            <span className="font-bold font-[family-name:var(--font-space-grotesk)]">{formatUSD(userData?.totalCommissions || 0)}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-white/[0.03] text-xs">
            <span className="text-white/40 flex items-center gap-2">
              <svg width="14" height="14" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              Package Spend
            </span>
            <span className="font-bold font-[family-name:var(--font-space-grotesk)]">{formatUSD(userData?.totalPackageSpend || 0)}</span>
          </div>
          <div className="flex justify-between items-center py-3 text-xs">
            <span className="text-white/40 flex items-center gap-2">
              <svg width="14" height="14" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              Team Size
            </span>
            <span className="font-bold font-[family-name:var(--font-space-grotesk)]">{(userData?.refLevel1 || 0) + (userData?.refLevel2 || 0) + (userData?.refLevel3 || 0)}</span>
          </div>
        </div>
      </div>

      {/* Referral Code */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
        <div className="text-[10px] font-extrabold text-white/30 uppercase tracking-wider mb-2">Referral Code</div>
        <div className="flex items-center gap-3">
          <div className="font-[family-name:var(--font-space-grotesk)] font-black text-2xl tracking-[4px] bg-gradient-to-r from-white to-purple-400/60 bg-clip-text text-transparent flex-1">
            {userData?.referralCode || '---'}
          </div>
          <button
            onClick={() => {
              const link = `${window.location.origin}/register?ref=${userData?.referralCode}`;
              navigator.clipboard.writeText(link);
              showToast('Invite link copied!');
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-black font-[family-name:var(--font-space-grotesk)] font-black text-xs"
          >
            Copy Link
          </button>
        </div>
      </div>

      {/* Member Since */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
        <div className="flex justify-between items-center text-xs">
          <span className="text-white/40">Member Since</span>
          <span className="font-bold">{userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : '-'}</span>
        </div>
        {userData?.streakDays != null && (
          <div className="flex justify-between items-center text-xs mt-2.5 pt-2.5 border-t border-white/[0.03]">
            <span className="text-white/40">Streak Days</span>
            <span className="font-bold">{userData.streakDays}</span>
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full py-4 rounded-2xl bg-red-500/[0.08] border border-red-500/20 text-red-400 font-[family-name:var(--font-space-grotesk)] font-extrabold text-sm transition-all hover:bg-red-500/[0.12]"
      >
        Log Out
      </button>
    </div>
  );
}
