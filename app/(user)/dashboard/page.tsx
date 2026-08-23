'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl, formatTimeAgo, formatUSD } from '@/lib/utils';
import { User, Notification, LeaderboardEntry } from '@/types/index';
import Loading from '@/components/ui/Loading';
import Card from '@/components/ui/Card';

function getRankInfo(balance: number) {
  if (balance < 10) return { label: 'ONC ROOKIE', cls: 'tag-rookie' };
  if (balance < 50) return { label: 'ONC SHARK', cls: 'tag-shark' };
  return { label: 'ONC WHALE', cls: 'tag-whale' };
}

function FireIcon({ streak }: { streak: number }) {
  const glow =
    streak >= 7
      ? 'animate-fire-glow'
      : streak >= 3
        ? 'animate-fire-glow-slow'
        : 'opacity-30';
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      className={glow}
    >
      <path
        d="M12 23c-4.97 0-9-3.58-9-8 0-3.07 2.25-5.74 3.84-7.54C8.29 5.86 9.5 4.2 9.5 2c0 0 1.5 1 3 3.5C14 8 15 10 15 12c0-1 1-3 3-4.5.5 1.5.5 3.5.5 5.5 0 5.52-2.91 10-6.5 10z"
        fill="#fbbf24"
        opacity="0.9"
      />
      <path
        d="M12 20c-2.76 0-5-2.24-5-5 0-2.15 1.65-3.86 2.5-4.8.8-1.06 1.5-2.2 1.5-3.7 0 0 0.8 1.1 1.5 2.7.7 1.6 1.5 3.2 1.5 4.8 0-0.7 0.7-2 2.5-3.2.3 0.9.3 2 0.3 3.2 0 3.31-2.02 6-4.8 6z"
        fill="#f59e0b"
      />
    </svg>
  );
}

export default function DashboardPage() {
  const { user, uid, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();

  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notiDropdownOpen, setNotiDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [miningTimeLeft, setMiningTimeLeft] = useState('');
  const [miningProgress, setMiningProgress] = useState(0);
  const [canClaim, setCanClaim] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [liveFeed, setLiveFeed] = useState<{ name: string; time: number }[]>(
    [],
  );
  const [latestUpdate, setLatestUpdate] = useState('Searching for updates...');
  const [monitorBanner, setMonitorBanner] = useState(false);
  const [directsActive, setDirectsActive] = useState(0);
  const [directsTotal, setDirectsTotal] = useState(0);

  const apiUrl = detectApiUrl();
  const miningTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notiDropdownRef = useRef<HTMLDivElement>(null);

  const logout = useCallback(async () => {
    const { getClientAuth } = await import('@/lib/firebase');
    const { signOut } = await import('firebase/auth');
    await signOut(getClientAuth());
    router.push('/login');
  }, [router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    async function fetchUser() {
      try {
        const res = await fetch(`${apiUrl}/api/user/${uid}`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (!cancelled) {
          setUserData(data);
          setMonitorBanner(data.leaderStatus === 'under_review');
        }
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchUser();
    const interval = setInterval(fetchUser, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [uid, apiUrl]);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    async function fetchNotifications() {
      try {
        const res = await fetch(`${apiUrl}/api/notifications/${uid}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          const list: Notification[] = data.notifications || data || [];
          setNotifications(list);
          setUnreadCount(
            list.filter((n) => !(n.readBy || []).includes(uid!)).length,
          );
        }
      } catch {
        /* silent */
      }
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [uid, apiUrl]);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch(`${apiUrl}/api/leaderboard?limit=3`);
        if (!res.ok) return;
        const data = await res.json();
        setLeaderboard(data.leaderboard || data || []);
      } catch {
        /* silent */
      }
    }
    fetchLeaderboard();
  }, [apiUrl]);

  useEffect(() => {
    if (!uid) return;
    async function fetchLiveFeed() {
      try {
        const res = await fetch(`${apiUrl}/api/leaderboard?limit=5`);
        if (!res.ok) return;
        const data = await res.json();
        const entries = data.leaderboard || data || [];
        setLiveFeed(
          entries.map((e: LeaderboardEntry) => ({
            name: e.name || 'Anonymous',
            time: Date.now(),
          })),
        );
      } catch {
        /* silent */
      }
    }
    fetchLiveFeed();
  }, [apiUrl, uid]);

  useEffect(() => {
    async function fetchUpdate() {
      try {
        const res = await fetch(`${apiUrl}/api/updates?limit=1`);
        if (!res.ok) return;
        const data = await res.json();
        const updates = data.updates || data || [];
        if (updates.length > 0)
          setLatestUpdate(updates[0].title || 'No updates');
      } catch {
        /* silent */
      }
    }
    fetchUpdate();
  }, [apiUrl]);

  useEffect(() => {
    if (!userData) return;
    function checkMining() {
      const lastClaim = userData?.lastClaim || 0;
      const diff = 86400000 - (Date.now() - lastClaim);
      if (diff <= 0) {
        setCanClaim(true);
        setMiningProgress(100);
        setMiningTimeLeft('');
      } else {
        setCanClaim(false);
        setMiningProgress(((86400000 - diff) / 86400000) * 100);
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setMiningTimeLeft(`${h}h ${m}m ${s}s UNTIL BLOCK`);
      }
    }
    checkMining();
    miningTimerRef.current = setInterval(checkMining, 1000);
    return () => {
      if (miningTimerRef.current) clearInterval(miningTimerRef.current);
    };
  }, [userData]);

  useEffect(() => {
    if (!uid) return;
    async function fetchDirects() {
      try {
        const res = await fetch(`${apiUrl}/api/referrals/team/${uid}`);
        if (!res.ok) return;
        const data = await res.json();
        setDirectsActive(data.activeDirects || 0);
        setDirectsTotal(data.totalDirects || 0);
      } catch {
        /* silent */
      }
    }
    fetchDirects();
  }, [uid, apiUrl]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        notiDropdownRef.current &&
        !notiDropdownRef.current.contains(e.target as Node)
      ) {
        setNotiDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleClaim() {
    if (!uid || claiming) return;
    setClaiming(true);
    try {
      const res = await fetch(`${apiUrl}/api/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          `${(data.claimedAmount || 0.05).toFixed(3)} ONC MINED`,
          'success',
        );
        const userRes = await fetch(`${apiUrl}/api/user/${uid}`);
        if (userRes.ok) setUserData(await userRes.json());
      } else {
        showToast(data.error || 'Mining failed', 'error');
      }
    } catch {
      showToast('Mining failed', 'error');
    } finally {
      setClaiming(false);
    }
  }

  async function handleMarkAllRead() {
    if (!uid) return;
    try {
      await fetch(`${apiUrl}/api/notifications/read-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          readBy: n.readBy?.includes(uid)
            ? n.readBy
            : [...(n.readBy || []), uid],
        })),
      );
      setUnreadCount(0);
    } catch {
      /* silent */
    }
  }

  async function handleDeleteNoti(id: string) {
    try {
      await fetch(`${apiUrl}/api/notifications/delete/${id}`, {
        method: 'DELETE',
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      /* silent */
    }
  }

  async function handleReadNoti(n: Notification) {
    if (!uid) return;
    try {
      await fetch(`${apiUrl}/api/notifications/read/${n.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });
      setNotifications((prev) =>
        prev.map((p) =>
          p.id === n.id
            ? { ...p, readBy: [...(p.readBy || []), uid] }
            : p,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (n.link) router.push(n.link);
    } catch {
      /* silent */
    }
  }

  function copyInvite() {
    if (!userData?.referralCode) return;
    const link = `${window.location.origin}/register?ref=${userData.referralCode}`;
    navigator.clipboard.writeText(link).catch(() => {});
    showToast('Referral link copied!', 'success');
  }

  if (authLoading || loading)
    return <Loading text="Synchronizing Nodes..." />;
  if (!user || !userData) return <Loading text="Loading..." />;

  const bal = userData.balance || 0;
  const rankInfo = getRankInfo(bal);
  const streak = userData.streakDays || 0;
  const boost = userData.packageBoost || 1;
  const dailyClaim = (0.05 * boost).toFixed(3);
  const used = userData.packageUsage || 0;
  const maxCap = userData.packageCap || 0;
  const tachoPct = maxCap > 0 ? Math.min(100, (used / maxCap) * 100) : 0;
  const needleRotation = -180 + (tachoPct / 100) * 180;
  const arcLen = 267;
  const arcOffset = arcLen - (arcLen * tachoPct) / 100;
  const pkgName = userData.activePackage
    ? userData.activePackage.charAt(0).toUpperCase() +
      userData.activePackage.slice(1)
    : 'None';
  const pkgStatus = userData.packageStatus || 'none';
  const statusLabel =
    pkgStatus === 'expired'
      ? 'Expired'
      : userData.activePackage
        ? 'Active'
        : 'None';
  const statusColor =
    pkgStatus === 'expired'
      ? '#ef4444'
      : userData.activePackage
        ? '#22c55e'
        : 'rgba(255,255,255,0.3)';
  const statusBg =
    pkgStatus === 'expired'
      ? 'rgba(239,68,68,0.1)'
      : userData.activePackage
        ? 'rgba(34,197,94,0.1)'
        : 'rgba(255,255,255,0.05)';
  const pctColor =
    tachoPct > 85 ? '#ef4444' : tachoPct > 60 ? '#f59e0b' : '#22c55e';
  const isTachoRed = tachoPct > 85;

  return (
    <>
      <style jsx global>{`
        @keyframes fire-glow {
          0%,
          100% {
            filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.4))
              drop-shadow(0 0 12px rgba(251, 191, 36, 0.2));
          }
          50% {
            filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.7))
              drop-shadow(0 0 20px rgba(251, 191, 36, 0.4));
          }
        }
        @keyframes fire-glow-slow {
          0%,
          100% {
            filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.3));
          }
          50% {
            filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.5));
          }
        }
        @keyframes tacho-pulse {
          0%,
          100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
        .tag-rookie {
          background: rgba(167, 139, 250, 0.1);
          color: var(--primary);
          border: 1px solid var(--primary);
        }
        .tag-shark {
          background: rgba(96, 165, 250, 0.1);
          color: var(--secondary);
          border: 1px solid var(--secondary);
        }
        .tag-whale {
          background: rgba(251, 191, 36, 0.1);
          color: #fbbf24;
          border: 1px solid #fbbf24;
        }
        .animate-fire-glow {
          animation: fire-glow 1s infinite;
        }
        .animate-fire-glow-slow {
          animation: fire-glow-slow 2s infinite;
        }
        .tacho-red .tacho-spike {
          animation: tacho-pulse 0.8s ease-in-out infinite;
        }
      `}</style>

      <div className="min-h-screen bg-[var(--bg)]">
        {/* ── NAV ── */}
        <nav className="fixed top-0 left-0 right-0 z-[100] p-3">
          <div className="max-w-[1200px] mx-auto flex justify-between items-center px-4 py-3 bg-white/[0.03] rounded-[22px] border border-white/[0.06] backdrop-blur-xl">
            <Link
              href="/dashboard"
              className="font-[family-name:var(--font-space-grotesk)] font-black text-white text-lg no-underline"
            >
              ONCHYRA
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative" ref={notiDropdownRef}>
                <button
                  onClick={() => setNotiDropdownOpen((prev) => !prev)}
                  className="relative p-1 cursor-pointer bg-transparent border-none"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-1 w-4 h-4 bg-[var(--red)] rounded-full text-[9px] font-extrabold text-white flex items-center justify-center border-2 border-[var(--bg)]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {notiDropdownOpen && (
                  <div className="absolute top-[calc(100%+12px)] right-0 w-[320px] max-h-[400px] bg-[#0b0d18] border border-white/[0.06] rounded-[20px] overflow-y-auto z-[2000] shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-fade-in max-sm:w-[calc(100vw-40px)] max-sm:-right-[60px]">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-white/[0.06]">
                      <span className="font-[family-name:var(--font-space-grotesk)] font-bold text-sm">
                        Notifications
                      </span>
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-[var(--primary)] bg-transparent border-none cursor-pointer font-bold"
                      >
                        Mark all read
                      </button>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center text-xs opacity-30">
                        No notifications
                      </div>
                    ) : (
                      notifications.slice(0, 30).map((n) => {
                        const isUnread = !(n.readBy || []).includes(uid!);
                        const typeColors: Record<string, string> = {
                          update: 'text-[var(--secondary)]',
                          poll: 'text-[var(--green)]',
                          trade_won: 'text-[var(--green)]',
                          trade_lost: 'text-[var(--red)]',
                          transaction: 'text-[var(--secondary)]',
                        };
                        const typeLabels: Record<string, string> = {
                          update: 'UPDATE',
                          poll: 'POLL',
                          trade_won: 'TRADE WON',
                          trade_lost: 'TRADE LOST',
                          transaction: 'TRANSACTION',
                          personal: 'PERSONAL',
                        };
                        return (
                          <div
                            key={n.id}
                            onClick={() => handleReadNoti(n)}
                            className={`flex items-start gap-2.5 px-4 py-3.5 border-b border-white/[0.02] cursor-pointer transition-colors hover:bg-white/[0.02] ${isUnread ? 'border-l-[3px] border-l-[var(--primary)]' : ''}`}
                          >
                            <div
                              className={`text-[8px] font-extrabold tracking-wider uppercase flex-shrink-0 mt-0.5 ${typeColors[n.type] || 'text-yellow-400'}`}
                            >
                              {typeLabels[n.type] || 'PERSONAL'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-semibold mb-0.5">
                                {n.title}
                              </div>
                              <div className="text-[11px] opacity-45 leading-relaxed">
                                {n.message}
                              </div>
                              {n.link && (
                                <div className="text-[11px] text-[var(--secondary)] underline mt-1">
                                  View
                                </div>
                              )}
                              <div className="text-[9px] opacity-30 mt-1">
                                {formatTimeAgo(n.createdAt)}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNoti(n.id);
                              }}
                              className="bg-transparent border-none text-white/20 text-lg cursor-pointer p-0 flex-shrink-0 transition-colors hover:text-[var(--red)]"
                            >
                              &times;
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
              <Link href="/profile" className="cursor-pointer">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-[1200px] mx-auto px-4 pt-[100px] pb-10">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Monitor Banner */}
            {monitorBanner && (
              <div className="col-span-full text-center py-3 px-4 border border-yellow-500/25 bg-gradient-to-r from-yellow-500/[0.08] to-yellow-600/[0.04] rounded-[20px]">
                <div className="flex items-center justify-center gap-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span className="text-[10px] font-bold text-yellow-500 tracking-wide">
                    Your account is being monitored. Please be careful with all
                    future activities.
                  </span>
                </div>
              </div>
            )}

            {/* ── BALANCE CARD ── */}
            <Card className="lg:col-span-2 text-center !rounded-[28px]">
              <div
                className={`inline-block text-[9px] font-black px-3 py-1 rounded-md uppercase tracking-[1px] mb-2.5 ${rankInfo.cls}`}
              >
                {rankInfo.label}
              </div>
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-[60px] my-1">
                {bal.toFixed(2)}
              </h2>
              <div
                className={`inline-flex items-center gap-2 mt-2 py-2 px-4 rounded-[30px] border transition-all ${
                  streak >= 7
                    ? 'bg-yellow-400/[0.12] border-yellow-400/[0.35] shadow-[0_0_15px_rgba(251,191,36,0.15)]'
                    : streak >= 3
                      ? 'bg-yellow-400/[0.08] border-yellow-400/[0.25]'
                      : streak > 0
                        ? 'bg-yellow-400/[0.05] border-yellow-400/[0.15]'
                        : 'bg-yellow-400/[0.05] border-yellow-400/[0.1]'
                }`}
              >
                <FireIcon streak={streak} />
                <span className="text-sm font-extrabold text-yellow-400">
                  {streak}{' '}
                  <span className="text-[10px] opacity-60">days</span>
                </span>
              </div>
            </Card>

            {/* ── 3 MINI CARDS ── */}
            <div className="col-span-full grid grid-cols-3 gap-2.5 max-sm:grid-cols-2">
              {/* Wallet */}
              <div className="bg-white/[0.03] border border-[var(--green)]/15 rounded-[28px] p-4 text-center overflow-hidden bg-gradient-to-b from-[var(--green)]/[0.04] to-transparent">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                  className="mx-auto mb-1.5"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M12 10a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                </svg>
                <div className="text-[7px] opacity-35 font-bold tracking-wider uppercase mb-0.5">
                  Wallet
                </div>
                <div className="font-extrabold text-base text-[var(--green)] font-[family-name:var(--font-space-grotesk)]">
                  {formatUSD(userData.walletBalance || 0)}
                </div>
                <Link
                  href="/deposit"
                  className="inline-flex items-center gap-1.5 mt-1.5 text-[7px] font-extrabold py-1.5 px-3.5 rounded-full bg-gradient-to-r from-[var(--green)] to-green-600 text-black no-underline tracking-wide shadow-[0_4px_12px_rgba(34,197,94,0.2)]"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  DEPOSIT
                </Link>
              </div>

              {/* Daily Claim */}
              <div className="bg-white/[0.03] border border-yellow-400/15 rounded-[28px] p-4 text-center overflow-hidden bg-gradient-to-b from-yellow-400/[0.04] to-transparent">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  className="mx-auto mb-1.5"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <div className="text-[7px] opacity-35 font-bold tracking-wider uppercase mb-0.5">
                  Daily Claim
                </div>
                <div className="font-extrabold text-base text-yellow-400 font-[family-name:var(--font-space-grotesk)]">
                  {dailyClaim} ONC
                </div>
                <div className="text-[7px] text-white/20 mt-0.5">
                  +{boost}x boost
                </div>
              </div>

              {/* Withdraw */}
              <div className="bg-white/[0.03] border border-[var(--red)]/15 rounded-[28px] p-4 text-center overflow-hidden bg-gradient-to-b from-[var(--red)]/[0.04] to-transparent max-sm:col-span-2">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  className="mx-auto mb-1.5"
                >
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                <div className="text-[7px] opacity-35 font-bold tracking-wider uppercase mb-0.5">
                  Withdraw
                </div>
                <div className="font-extrabold text-base text-[var(--red)] font-[family-name:var(--font-space-grotesk)]">
                  {formatUSD(userData.commissionBalance || 0)}
                </div>
                <Link
                  href="/withdraw"
                  className="inline-flex items-center gap-1.5 mt-1.5 text-[7px] font-extrabold py-1.5 px-3.5 rounded-full bg-gradient-to-r from-[var(--red)] to-red-700 text-white no-underline tracking-wide shadow-[0_4px_12px_rgba(239,68,68,0.2)]"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  WITHDRAW
                </Link>
              </div>
            </div>

            {/* ── ACTIVE DIRECTS + TEAM BUSINESS ── */}
            <div className="col-span-full grid grid-cols-2 gap-2.5">
              <Card className="text-center !p-3.5">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="2"
                  className="mx-auto mb-1"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <div className="text-[7px] opacity-35 font-bold tracking-wider uppercase mb-1">
                  Active Directs
                </div>
                <div className="font-extrabold text-2xl font-[family-name:var(--font-space-grotesk)]">
                  <span className="text-[var(--green)]">
                    {directsActive || userData.activeDirects || 0}
                  </span>
                  <span className="opacity-30">/</span>
                  <span className="text-[var(--secondary)]">
                    {directsTotal || userData.totalDirects || 0}
                  </span>
                </div>
              </Card>
              <Card className="text-center !p-3.5">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  className="mx-auto mb-1"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <div className="text-[7px] opacity-35 font-bold tracking-wider uppercase mb-1">
                  Team Business
                </div>
                <div className="font-extrabold text-lg text-yellow-500 font-[family-name:var(--font-space-grotesk)]">
                  {formatUSD(userData.teamBiz || 0)}
                </div>
              </Card>
            </div>

            {/* ── MINING BOOST / RANK / PACKAGE ── */}
            <div className="col-span-full grid grid-cols-3 gap-2.5">
              <Card className="text-center !p-3">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                  className="mx-auto mb-0.5"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <div className="text-[7px] opacity-35 font-bold tracking-wider uppercase mb-0.5">
                  Mining Boost
                </div>
                <div className="font-extrabold text-[15px] text-[var(--green)] font-[family-name:var(--font-space-grotesk)]">
                  {boost}x
                </div>
              </Card>
              <Card className="text-center !p-3">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  className="mx-auto mb-0.5"
                >
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 8 5 9 7v2" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 16 5 15 7v2" />
                  <path d="M4 22h16" />
                  <path d="M10 22V8h4v14" />
                  <path d="M12 2v3" />
                </svg>
                <div className="text-[7px] opacity-35 font-bold tracking-wider uppercase mb-0.5">
                  Rank
                </div>
                <div className="font-extrabold text-[15px] text-yellow-400 font-[family-name:var(--font-space-grotesk)]">
                  {userData.rank || '-'}
                </div>
              </Card>
              <Card className="text-center !p-3">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#a78bfa"
                  strokeWidth="2"
                  className="mx-auto mb-0.5"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                <div className="text-[7px] opacity-35 font-bold tracking-wider uppercase mb-0.5">
                  Package
                </div>
                <div className="font-extrabold text-[15px] text-[var(--primary)] font-[family-name:var(--font-space-grotesk)]">
                  {pkgName}
                </div>
                <span
                  className="text-[6px] font-bold py-0.5 px-1.5 rounded inline-block mt-0.5"
                  style={{ background: statusBg, color: statusColor }}
                >
                  {statusLabel}
                </span>
              </Card>
            </div>

            {/* ── MINING PROTOCOL ── */}
            <Card className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                <span className="text-[9px] font-extrabold tracking-[1.5px] uppercase text-white/35">
                  Mining Protocol
                </span>
                <span className="text-[8px] font-bold ml-auto bg-[var(--green)]/10 text-[var(--green)] py-0.5 px-2 rounded-md">
                  {boost}x Boost
                </span>
              </div>
              <div className="bg-[#111] h-2 rounded-[20px] overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--green)] transition-all duration-1000"
                  style={{ width: `${miningProgress}%` }}
                />
              </div>
              <button
                onClick={handleClaim}
                disabled={!canClaim || claiming}
                className={`w-full py-[22px] rounded-[22px] font-black text-base uppercase transition-all ${
                  canClaim && !claiming
                    ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-black cursor-pointer'
                    : 'bg-[#1a1a1a] text-[#444] cursor-not-allowed'
                }`}
              >
                {claiming
                  ? 'PROCESSING...'
                  : canClaim
                    ? 'START MINING SESSION'
                    : miningTimeLeft}
              </button>
            </Card>

            {/* ── CAP EARNINGS TACHOMETER ── */}
            <Card
              className={`lg:col-span-2 text-center !p-4 ${isTachoRed ? 'tacho-red' : ''}`}
            >
              <div className="flex justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-[8px] opacity-40 font-bold tracking-[1.5px] uppercase">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="url(#tachoRainbow)"
                    strokeWidth="2"
                  >
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  <span
                    style={{
                      background:
                        'linear-gradient(90deg,#a78bfa,#60a5fa,#22c55e,#eab308)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Cap Earnings
                  </span>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-[var(--primary)]">
                    {userData.activePackage || '-'}
                  </span>
                  <span
                    className="text-[7px] font-extrabold py-0.5 px-[7px] rounded-md ml-1.5"
                    style={{ background: statusBg, color: statusColor }}
                  >
                    {statusLabel}
                  </span>
                </div>
              </div>
              <div className="relative inline-block w-[200px] h-[120px] overflow-hidden mx-auto mb-1">
                <svg
                  width="200"
                  height="130"
                  viewBox="0 0 200 130"
                  className="block"
                >
                  <defs>
                    <linearGradient
                      id="tachoRainbow"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="20%" stopColor="#3b82f6" />
                      <stop offset="40%" stopColor="#06b6d4" />
                      <stop offset="55%" stopColor="#22c55e" />
                      <stop offset="70%" stopColor="#eab308" />
                      <stop offset="85%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                    <linearGradient
                      id="needleGrad"
                      x1="0"
                      y1="1"
                      x2="0"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="50%" stopColor="#f472b6" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                    <filter id="needleGlow">
                      <feGaussianBlur
                        stdDeviation="3"
                        result="blur"
                      />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="arcGlow">
                      <feGaussianBlur stdDeviation="6" />
                    </filter>
                  </defs>
                  <path
                    d="M 30 120 A 85 85 0 0 1 170 120"
                    fill="none"
                    stroke="url(#tachoRainbow)"
                    strokeWidth="18"
                    strokeLinecap="round"
                    opacity="0.08"
                    filter="url(#arcGlow)"
                  />
                  <path
                    d="M 30 120 A 85 85 0 0 1 170 120"
                    fill="none"
                    stroke="rgba(255,255,255,0.03)"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 30 120 A 85 85 0 0 1 170 120"
                    fill="none"
                    stroke="url(#tachoRainbow)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray="267"
                    strokeDashoffset={arcOffset}
                    style={{
                      transition:
                        'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)',
                    }}
                  />
                  <g
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <line
                      x1="34"
                      y1="40"
                      x2="41"
                      y2="49"
                      transform="rotate(-90 100 120)"
                      stroke="#8b5cf6"
                      opacity="0.4"
                    />
                    <line
                      x1="34"
                      y1="40"
                      x2="41"
                      y2="49"
                      transform="rotate(-63 100 120)"
                      stroke="#3b82f6"
                      opacity="0.5"
                    />
                    <line
                      x1="34"
                      y1="40"
                      x2="41"
                      y2="49"
                      transform="rotate(-36 100 120)"
                      stroke="#06b6d4"
                      opacity="0.5"
                    />
                    <line
                      x1="34"
                      y1="40"
                      x2="41"
                      y2="49"
                      transform="rotate(-9 100 120)"
                      stroke="#22c55e"
                      opacity="0.6"
                    />
                    <line
                      x1="34"
                      y1="40"
                      x2="41"
                      y2="49"
                      transform="rotate(18 100 120)"
                      stroke="#65a30d"
                      opacity="0.6"
                    />
                    <line
                      x1="34"
                      y1="40"
                      x2="41"
                      y2="49"
                      transform="rotate(45 100 120)"
                      stroke="#eab308"
                      opacity="0.6"
                    />
                    <line
                      x1="34"
                      y1="40"
                      x2="41"
                      y2="49"
                      transform="rotate(72 100 120)"
                      stroke="#f97316"
                      opacity="0.7"
                    />
                    <line
                      x1="34"
                      y1="40"
                      x2="41"
                      y2="49"
                      transform="rotate(99 100 120)"
                      stroke="#ef4444"
                      opacity="0.7"
                    />
                    <line
                      x1="34"
                      y1="40"
                      x2="41"
                      y2="49"
                      transform="rotate(126 100 120)"
                      stroke="#ef4444"
                      opacity="0.8"
                    />
                    <line
                      x1="34"
                      y1="40"
                      x2="41"
                      y2="49"
                      transform="rotate(153 100 120)"
                      stroke="#dc2626"
                      opacity="0.8"
                    />
                    <line
                      x1="32"
                      y1="38"
                      x2="41"
                      y2="49"
                      transform="rotate(180 100 120)"
                      stroke="#b91c1c"
                      opacity="0.5"
                    />
                  </g>
                  <g
                    className="tacho-spike"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity="0.8"
                  >
                    <line
                      x1="36"
                      y1="42"
                      x2="45"
                      y2="53"
                      transform="rotate(126 100 120)"
                    />
                    <line
                      x1="36"
                      y1="42"
                      x2="45"
                      y2="53"
                      transform="rotate(153 100 120)"
                    />
                  </g>
                  <g fill="rgba(255,255,255,0.15)">
                    <circle cx="42" cy="73" r="1.5" />
                    <circle cx="53" cy="50" r="1.5" />
                    <circle cx="72" cy="36" r="1.5" />
                    <circle cx="100" cy="29" r="1.5" />
                    <circle cx="128" cy="36" r="1.5" />
                    <circle cx="147" cy="50" r="1.5" />
                    <circle cx="158" cy="73" r="1.5" />
                  </g>
                  <g
                    transform={`rotate(${needleRotation} 100 120)`}
                    style={{
                      transformOrigin: '100px 120px',
                      transition:
                        'transform 1.2s cubic-bezier(0.4,0,0.2,1)',
                    }}
                  >
                    <line
                      x1="100"
                      y1="120"
                      x2="100"
                      y2="44"
                      stroke="url(#needleGrad)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      filter="url(#needleGlow)"
                    />
                    <circle
                      cx="100"
                      cy="120"
                      r="6"
                      fill="#a78bfa"
                      opacity="0.9"
                      filter="url(#needleGlow)"
                    />
                    <circle cx="100" cy="120" r="3" fill="#fff" />
                    <circle cx="100" cy="120" r="1.5" fill="#a78bfa" />
                    <line
                      x1="100"
                      y1="120"
                      x2="100"
                      y2="127"
                      stroke="url(#needleGrad)"
                      strokeWidth="2.5"
                      opacity="0.5"
                    />
                  </g>
                </svg>
                <div className="absolute bottom-[18px] left-1/2 -translate-x-1/2 text-center pointer-events-none">
                  <div
                    className="font-[family-name:var(--font-space-grotesk)] font-black text-lg leading-none"
                    style={{ color: pctColor }}
                  >
                    {tachoPct.toFixed(0)}%
                  </div>
                  <div className="text-[8px] text-white/20 tracking-wider">
                    USED
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-5 text-[9px]">
                <div>
                  <span className="opacity-40">Used </span>
                  <span className="font-extrabold text-[var(--primary)]">
                    {formatUSD(used)}
                  </span>
                </div>
                <div>
                  <span className="opacity-40">Max </span>
                  <span className="font-extrabold text-[var(--secondary)]">
                    {formatUSD(maxCap)}
                  </span>
                </div>
                <div>
                  <span className="opacity-40">Remaining </span>
                  <span className="font-extrabold text-[var(--green)]">
                    {formatUSD(Math.max(0, maxCap - used))}
                  </span>
                </div>
              </div>
            </Card>

            {/* ── PROTOCOL UPDATE ── */}
            <Link
              href="/updates"
              className="lg:col-span-2 block bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 border-l-4 border-l-[var(--primary)] cursor-pointer no-underline hover:bg-white/[0.06] transition-all"
            >
              <div className="flex items-center gap-1.5">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="2"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <div className="text-[9px] font-extrabold text-[var(--primary)]">
                  PROTOCOL UPDATE
                </div>
              </div>
              <div className="text-sm font-semibold mt-1.5 text-white">
                {latestUpdate}
              </div>
            </Link>

            {/* ── REFERRAL CODE ── */}
            <Card
              className="lg:col-span-2"
              style={{
                background:
                  'linear-gradient(135deg,rgba(167,139,250,0.08),rgba(96,165,250,0.06))',
                borderColor: 'rgba(167,139,250,0.25)',
              }}
            >
              <div className="flex items-center gap-1.5 mb-2.5">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="2"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2 2" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <div className="text-[9px] font-extrabold text-[var(--primary)] tracking-[2px] uppercase">
                  Your Referral Code
                </div>
              </div>
              <div className="flex justify-between items-center gap-4 flex-wrap">
                <div>
                  <div className="font-[family-name:var(--font-space-grotesk)] font-black text-white tracking-[5px] text-2xl">
                    {userData.referralCode || '...'}
                  </div>
                  <div className="text-[10px] opacity-45 mt-1.5">
                    Share &amp; earn bonus ONC for every friend who joins
                  </div>
                </div>
                <button
                  onClick={copyInvite}
                  className="bg-white text-black border-none rounded-2xl font-black text-xs cursor-pointer whitespace-nowrap py-3.5 px-6"
                >
                  INVITE
                </button>
              </div>
            </Card>

            {/* ── REFERRAL REWARDS HUB ── */}
            <Card className="lg:col-span-2 !p-0 !bg-transparent !border-none">
              <div className="bg-white/[0.05] border border-[var(--primary)]/20 rounded-[24px] p-4 backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-3.5 px-1">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="2"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span className="text-[9px] font-extrabold tracking-[1.5px] uppercase text-white/35">
                    Referral Rewards Hub
                  </span>
                </div>
                {(
                  [
                    {
                      level: 1,
                      color: '#a78bfa',
                      borderColor: 'rgba(167,139,250,0.4)',
                      label: 'Direct Referrals',
                      earned: (
                        (userData.referrals || directsTotal) *
                        0.25
                      ).toFixed(2),
                      team:
                        directsTotal || userData.refLevel1 || 0,
                    },
                    {
                      level: 2,
                      color: '#60a5fa',
                      borderColor: 'rgba(96,165,250,0.4)',
                      label: 'Indirect Referrals',
                      earned: (
                        (userData.refLevel2 || 0) * 0.1
                      ).toFixed(2),
                      team: userData.refLevel2 || 0,
                    },
                    {
                      level: 3,
                      color: '#fbbf24',
                      borderColor: 'rgba(251,191,36,0.4)',
                      label: 'Tier 3 Referrals',
                      earned: (
                        (userData.refLevel3 || 0) * 0.05
                      ).toFixed(2),
                      team: userData.refLevel3 || 0,
                    },
                  ] as const
                ).map(
                  ({
                    level,
                    color,
                    borderColor,
                    label,
                    earned,
                    team,
                  }) => (
                    <div
                      key={level}
                      className="flex items-center gap-3.5 bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-3.5 mb-2.5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                    >
                      <div className="relative w-[42px] h-[42px] rounded-full flex items-center justify-center flex-shrink-0">
                        <svg
                          viewBox="0 0 42 42"
                          fill="none"
                          className="absolute inset-0 w-full h-full"
                        >
                          <circle
                            cx="21"
                            cy="21"
                            r="20"
                            stroke={borderColor}
                            strokeWidth="1.5"
                          />
                          <circle
                            cx="21"
                            cy="21"
                            r="16"
                            fill={borderColor.replace('0.4', '0.12')}
                          />
                          <circle
                            cx="21"
                            cy="21"
                            r="16"
                            stroke={borderColor.replace('0.4', '0.3')}
                            strokeWidth="1"
                          />
                        </svg>
                        <span className="relative z-10 font-[family-name:var(--font-space-grotesk)] font-black text-base text-white">
                          {level}
                        </span>
                      </div>
                      <div>
                        <div
                          className="font-[family-name:var(--font-space-grotesk)] font-bold text-[13px]"
                          style={{ color }}
                        >
                          Level {level}
                        </div>
                        <div className="text-[8px] font-bold uppercase tracking-wider text-white/20 mt-px">
                          {label}
                        </div>
                      </div>
                      <div className="flex gap-4 ml-auto flex-shrink-0">
                        <div className="text-center">
                          <div className="font-[family-name:var(--font-space-grotesk)] font-black text-[15px] leading-tight text-[var(--green)]">
                            {earned} ONC
                          </div>
                          <div className="text-[7px] font-bold uppercase text-white/20 mt-0.5">
                            Referral Earned
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-[family-name:var(--font-space-grotesk)] font-black text-[15px] leading-tight text-[var(--secondary)]">
                            {team}
                          </div>
                          <div className="text-[7px] font-bold uppercase text-white/20 mt-0.5">
                            Team Members
                          </div>
                        </div>
                        <Link
                          href="/referrals"
                          className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-[var(--primary)]/[0.08] border border-[var(--primary)]/12 text-[var(--primary)] no-underline transition-all hover:bg-[var(--primary)]/[0.2]"
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </Card>

            {/* ── LEADERBOARD PREVIEW ── */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[13px] font-[family-name:var(--font-space-grotesk)] flex items-center gap-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="8" r="6" />
                    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                  </svg>
                  TOP VALIDATORS
                </h3>
                <Link
                  href="/leaderboard"
                  className="text-[10px] font-extrabold text-[var(--primary)] no-underline bg-[var(--primary)]/10 border border-[var(--primary)]/30 py-1.5 px-3.5 rounded-full whitespace-nowrap"
                >
                  VIEW ALL &rarr;
                </Link>
              </div>
              <div>
                {leaderboard.length === 0 ? (
                  <div className="text-center text-xs opacity-30 py-6">
                    Loading...
                  </div>
                ) : (
                  leaderboard.slice(0, 3).map((entry, i) => (
                    <div
                      key={entry.uid}
                      className="flex justify-between items-center py-3 px-3 bg-white/[0.02] rounded-[14px] mb-2 text-[11px] border border-white/[0.03]"
                    >
                      <span className="font-bold text-white">
                        <span className="text-[var(--primary)] text-[10px] mr-1.5">
                          #{i + 1}
                        </span>
                        {entry.name || 'Anonymous'}
                      </span>
                      <b>{(entry.balance || 0).toFixed(2)} ONC</b>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* ── LIVE ACTIVITY ── */}
            <Card className="lg:col-span-2">
              <h3 className="text-xs mb-4 flex items-center gap-2">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                LIVE ACTIVITY
              </h3>
              <div>
                {liveFeed.length === 0 ? (
                  <div className="text-center text-xs opacity-30 py-4">
                    No activity yet
                  </div>
                ) : (
                  liveFeed.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center py-3 px-3 bg-white/[0.02] rounded-[14px] mb-2 text-[11px] border border-white/[0.03]"
                    >
                      <span>
                        <b className="font-bold text-white">{item.name}</b>{' '}
                        synchronized
                      </span>
                      <span className="opacity-50 text-[10px]">
                        {formatTimeAgo(item.time)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* ── FOOTER ── */}
            <Card
              className="lg:col-span-2 text-center !p-10"
              style={{
                background:
                  'linear-gradient(135deg,rgba(167,139,250,0.05),rgba(96,165,250,0.03))',
                borderColor: 'rgba(167,139,250,0.12)',
              }}
            >
              <div className="font-[family-name:var(--font-space-grotesk)] text-[32px] font-black bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent mb-2">
                ONCHYRA
              </div>
              <div className="text-[10px] opacity-40 tracking-[3px] mb-1.5">
                DECENTRALIZED VALIDATION NETWORK
              </div>
              <div className="text-[10px] opacity-30 mb-6">
                Mine The Future.
              </div>
              <div className="flex justify-center gap-4 mb-6">
                <a
                  href="https://t.me/onchyra"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-11 h-11 rounded-full bg-white/[0.04] border border-white/[0.08] transition-all hover:bg-white/[0.08]"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="#60a5fa"
                  >
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.216s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                </a>
                <a
                  href="https://youtube.com/@onchyra"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-11 h-11 rounded-full bg-white/[0.04] border border-white/[0.08] transition-all hover:bg-white/[0.08]"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="#ef4444"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
                <a
                  href="https://instagram.com/onchyra"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-11 h-11 rounded-full bg-white/[0.04] border border-white/[0.08] transition-all hover:bg-white/[0.08]"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="url(#igGrad)"
                  >
                    <defs>
                      <linearGradient
                        id="igGrad"
                        x1="0%"
                        y1="100%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#feda75" />
                        <stop offset="25%" stopColor="#fa7e1e" />
                        <stop offset="50%" stopColor="#d62976" />
                        <stop offset="75%" stopColor="#962fbf" />
                        <stop offset="100%" stopColor="#4f5bd5" />
                      </linearGradient>
                    </defs>
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                  </svg>
                </a>
              </div>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent mx-auto mb-4" />
              <div className="text-[9px] opacity-20 tracking-wider">
                &copy; 2026 ONCHYRA PROTOCOL &middot; ALL RIGHTS RESERVED
              </div>
            </Card>
          </div>
        </div>
      </div>

      {ToastComponent}
    </>
  );
}
