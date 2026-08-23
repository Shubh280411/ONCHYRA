'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl, formatTimeAgo } from '@/lib/utils';
import Loading from '@/components/ui/Loading';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface UserData {
  id: string;
  name: string;
  email: string;
  balance: number;
  streak: number;
  lastClaim: number;
  referredBy: string;
  referralCode: string;
  banned: boolean;
  refLevel1: number;
  refLevel2: number;
  refLevel3: number;
}

export default function AdminUsersPage() {
  const { uid, loading: authLoading } = useAuth();
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [amount, setAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'transactions'>('search');
  const [transactions, setTransactions] = useState<Record<string, unknown>[]>([]);
  const [statTotal, setStatTotal] = useState(0);
  const [statBanned, setStatBanned] = useState(0);
  const [statOnc, setStatOnc] = useState(0);
  const [loading, setLoading] = useState(true);
  const { showToast, ToastComponent } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!uid) { router.push('/admin/login'); return; }
    loadUsers();
  }, [uid, authLoading]);

  async function loadUsers() {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/users`, { headers: { 'x-auth-uid': uid! } });
      if (!res.ok) { router.push('/admin/login'); return; }
      const data = await res.json();
      const users: UserData[] = Array.isArray(data) ? data.map((u: Record<string, unknown>) => ({
        id: (u.id || u.uid || '') as string,
        name: (u.name || '') as string,
        email: (u.email || '') as string,
        balance: Number(u.balance || 0),
        streak: Number(u.streak || 0),
        lastClaim: Number(u.lastClaim || 0),
        referredBy: (u.referredBy || '') as string,
        referralCode: (u.referralCode || '') as string,
        banned: Boolean(u.banned),
        refLevel1: Number(u.refLevel1 || 0),
        refLevel2: Number(u.refLevel2 || 0),
        refLevel3: Number(u.refLevel3 || 0),
      })) : [];
      setAllUsers(users);
      setStatTotal(users.length);
      setStatBanned(users.filter((u) => u.banned).length);
      setStatOnc(users.reduce((s, u) => s + u.balance, 0));
      setLoading(false);
    } catch {
      showToast('Failed to load users', 'error');
      setLoading(false);
    }
  }

  const handleSearch = useCallback((val: string) => {
    setSearchQuery(val);
    setSelectedUser(null);
    if (val.length < 2) { setSearchResults([]); return; }
    const sk = val.toLowerCase();
    const matches = allUsers.filter((u) =>
      (u.name && u.name.toLowerCase().includes(sk)) ||
      (u.email && u.email.toLowerCase().includes(sk)) ||
      (u.referralCode && u.referralCode.toLowerCase().includes(sk)) ||
      (u.id && u.id.toLowerCase().includes(sk))
    );
    setSearchResults(matches.slice(0, 20));
  }, [allUsers]);

  async function selectUser(u: UserData) {
    setSelectedUser(u);
    setSearchResults([]);
    setSearchQuery('');
    loadTransactions();
  }

  async function loadTransactions() {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/transactions`, { headers: { 'x-auth-uid': uid! } });
      if (res.ok) {
        const data = await res.json();
        setTransactions(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
  }

  async function updateBalance(isAdd: boolean) {
    if (!selectedUser || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      showToast('Enter a valid amount', 'error');
      return;
    }
    const amt = Number(amount);
    const action = isAdd ? 'Add' : 'Remove';
    if (!confirm(`${action} ${amt} ONC ${isAdd ? 'to' : 'from'} ${selectedUser.name || 'user'}?`)) return;

    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/user/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: isAdd ? 'add_balance' : 'remove_balance',
          amount: amt,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      showToast(`${amt} ONC ${isAdd ? 'added' : 'removed'}!`);
      setAmount('');
      loadUsers();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    }
  }

  async function handleBan(ban: boolean) {
    if (!selectedUser) return;
    if (!confirm(`${ban ? 'BAN' : 'UNBAN'} ${selectedUser.name || 'user'}?`)) return;
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/user/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({ userId: selectedUser.id, action: 'set_banned', banned: ban }),
      });
      if (!res.ok) throw new Error('Failed');
      showToast(`User ${ban ? 'banned' : 'unbanned'}!`);
      loadUsers();
      setSelectedUser({ ...selectedUser, banned: ban });
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    }
  }

  if (loading) return <Loading text="Loading users..." />;

  return (
    <div className="min-h-screen bg-[var(--bg)] bg-[radial-gradient(ellipse_at_20%_0%,rgba(167,139,250,0.06)_0%,transparent_50%),radial-gradient(ellipse_at_80%_100%,rgba(96,165,250,0.04)_0%,transparent_50%)]">
      <div className="max-w-[1000px] mx-auto p-5 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between p-4 mb-7 bg-white/[0.03] border border-white/[0.08] rounded-[20px] backdrop-blur-xl max-sm:flex-col max-sm:gap-3.5">
          <div className="flex items-center gap-3.5">
            <div className="w-[42px] h-[42px] bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-xl flex items-center justify-center font-[family-name:var(--font-space-grotesk)] font-black text-base text-black">ON</div>
            <div>
              <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-extrabold bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">ONCHYRA Control Center</h1>
              <div className="text-[11px] text-white/35">Admin Panel — User Management</div>
            </div>
          </div>
          <button onClick={() => { import('firebase/auth').then(({ signOut }) => { getClientAuth().then((auth) => { signOut(auth); router.push('/admin/login'); }); }); }} className="px-4 py-2.5 rounded-[14px] bg-red-500/10 text-[var(--danger)] font-bold text-xs cursor-pointer border border-red-500/15 hover:bg-red-500/20 transition-all">Logout</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5 max-sm:grid-cols-2">
          <Card className="text-center"><div className="text-[10px] uppercase tracking-[1.5px] text-white/35 font-bold">Total Miners</div><div className="font-[family-name:var(--font-space-grotesk)] text-[26px] font-extrabold mt-1.5 text-[var(--primary)]">{statTotal}</div></Card>
          <Card className="text-center"><div className="text-[10px] uppercase tracking-[1.5px] text-white/35 font-bold">Banned</div><div className="font-[family-name:var(--font-space-grotesk)] text-[26px] font-extrabold mt-1.5 text-yellow-400">{statBanned}</div></Card>
          <Card className="text-center"><div className="text-[10px] uppercase tracking-[1.5px] text-white/35 font-bold">Total ONC</div><div className="font-[family-name:var(--font-space-grotesk)] text-[26px] font-extrabold mt-1.5 text-[var(--secondary)]">{statOnc.toFixed(1)}</div></Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 p-1.5 bg-white/[0.03] border border-white/[0.08] rounded-[16px]">
          {(['search', 'transactions'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-center rounded-xl text-xs font-bold uppercase tracking-wider border-none cursor-pointer transition-all font-[family-name:var(--font-inter)] ${activeTab === tab ? 'bg-[var(--primary)]/15 text-[var(--primary)]' : 'bg-transparent text-white/35 hover:text-white/70'}`}>
              {tab === 'search' ? 'Search' : 'Transactions'}
            </button>
          ))}
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <>
            <div className="relative mb-4">
              <svg className="absolute left-4.5 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                className="w-full py-4 pl-12 pr-5 rounded-[18px] border border-white/[0.08] bg-white/[0.03] text-white text-sm font-medium outline-none transition-all focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(167,139,250,0.1)] placeholder:text-white/35"
                placeholder="Search by name, email, referral code, UID..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                autoComplete="off"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-[#0d0f1e] border border-white/[0.08] rounded-[18px] max-h-[320px] overflow-y-auto z-[999] shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                  {searchResults.map((u) => (
                    <div key={u.id} onClick={() => selectUser(u)} className="flex items-center gap-3.5 p-3.5 cursor-pointer border-b border-white/[0.08] hover:bg-[var(--primary)]/8 transition-colors last:border-b-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--secondary)]/15 flex items-center justify-center font-[family-name:var(--font-space-grotesk)] font-extrabold text-base text-[var(--primary)] flex-shrink-0">{(u.name || '?')[0].toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[13px] truncate">{u.name || 'Unknown'}</div>
                        <div className="text-[11px] text-white/35 mt-0.5">{u.email || ''} · {u.referralCode || 'No code'}</div>
                      </div>
                      <div className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex-shrink-0 ${u.banned ? 'bg-red-500/12 text-[var(--danger)] border border-red-500/20' : 'bg-green-500/12 text-[var(--success)] border border-green-500/20'}`}>
                        {u.banned ? 'Banned' : 'Active'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User Panel */}
            {selectedUser && (
              <div className="animate-[fadeIn_0.3s_ease]">
                <Card className="mb-4">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center font-[family-name:var(--font-space-grotesk)] font-black text-2xl text-black flex-shrink-0">{(selectedUser.name || '?')[0].toUpperCase()}</div>
                    <div>
                      <div className="font-[family-name:var(--font-space-grotesk)] text-xl font-extrabold">{selectedUser.name || 'Unknown'} {selectedUser.streak ? <span className="text-base">🔥</span> : ''}</div>
                      <div className="text-xs text-yellow-400 font-bold mt-1 tracking-wider">{selectedUser.referralCode}</div>
                    </div>
                    <div className="ml-auto">
                      <div className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${selectedUser.banned ? 'bg-red-500/12 text-[var(--danger)] border border-red-500/20' : 'bg-green-500/12 text-[var(--success)] border border-green-500/20'}`}>
                        {selectedUser.banned ? 'BANNED' : 'ACTIVE'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5 max-sm:grid-cols-1">
                    <div className="bg-white/[0.02] border border-white/[0.08] rounded-[14px] p-3.5"><div className="text-[10px] uppercase tracking-[1.5px] text-white/35 font-bold">Balance</div><div className="text-[15px] font-bold mt-1.5 text-[var(--success)] font-[family-name:var(--font-space-grotesk)]">{selectedUser.balance.toFixed(4)} ONC</div></div>
                    <div className="bg-white/[0.02] border border-white/[0.08] rounded-[14px] p-3.5"><div className="text-[10px] uppercase tracking-[1.5px] text-white/35 font-bold">Streak</div><div className="text-[15px] font-bold mt-1.5">{selectedUser.streak || 0} 🔥 days</div></div>
                    <div className="bg-white/[0.02] border border-white/[0.08] rounded-[14px] p-3.5"><div className="text-[10px] uppercase tracking-[1.5px] text-white/35 font-bold">Last Claimed</div><div className="text-[12px] font-bold mt-1.5">{selectedUser.lastClaim ? formatTimeAgo(selectedUser.lastClaim) : 'Never'}</div></div>
                    <div className="bg-white/[0.02] border border-white/[0.08] rounded-[14px] p-3.5"><div className="text-[10px] uppercase tracking-[1.5px] text-white/35 font-bold">Referred By</div><div className="text-[12px] font-bold mt-1.5">{selectedUser.referredBy || 'Direct Join'}</div></div>
                    <div className="bg-white/[0.02] border border-white/[0.08] rounded-[14px] p-3.5 col-span-2 max-sm:col-span-1"><div className="text-[10px] uppercase tracking-[1.5px] text-white/35 font-bold">UID</div><div className="text-[11px] font-bold mt-1.5 text-white/35 break-all">{selectedUser.id}</div></div>
                  </div>

                  <div className="text-[10px] font-extrabold text-white/35 uppercase tracking-[1.5px] mb-2.5">Referral Network</div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[{ l: 'Level 1', v: selectedUser.refLevel1 }, { l: 'Level 2', v: selectedUser.refLevel2 }, { l: 'Level 3', v: selectedUser.refLevel3 }].map((r) => (
                      <div key={r.l} className="text-center bg-[var(--primary)]/4 border border-[var(--primary)]/8 rounded-[14px] p-3.5">
                        <div className="font-[family-name:var(--font-space-grotesk)] text-[22px] font-extrabold text-[var(--primary)]">{r.v}</div>
                        <div className="text-[10px] text-white/35 font-bold uppercase tracking-wider mt-1">{r.l}</div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Adjust Balance */}
                <Card className="mb-4">
                  <div className="flex items-center gap-2.5 mb-4 text-sm font-bold font-[family-name:var(--font-space-grotesk)]">
                    <div className="w-[30px] h-[30px] rounded-[10px] bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center text-sm">💰</div>
                    Adjust Balance
                  </div>
                  <div className="relative mb-3.5">
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" step="0.01" className="w-full py-4 pr-12 pl-[18px] rounded-[14px] border border-white/[0.08] bg-white/[0.03] text-white text-lg font-bold font-[family-name:var(--font-space-grotesk)] outline-none transition-all focus:border-[var(--primary)] placeholder:text-white/35" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-white/35">ONC</span>
                  </div>
                  <div className="flex gap-2 flex-wrap mb-3.5">
                    {[10, 25, 50, 100, 250, 500].map((v) => (
                      <button key={v} onClick={() => setAmount(String(v))} className="px-4 py-2 border border-white/[0.08] rounded-[10px] bg-white/[0.03] text-white/70 text-xs font-bold cursor-pointer transition-all hover:bg-[var(--primary)]/10 hover:border-[var(--primary)]/20 hover:text-[var(--primary)]">+{v}</button>
                    ))}
                  </div>
                  <div className="flex gap-2.5">
                    <Button onClick={() => updateBalance(true)} className="flex-1">Add ONC</Button>
                    <Button variant="danger" onClick={() => updateBalance(false)} className="flex-1">Remove ONC</Button>
                  </div>
                </Card>

                {/* User Status */}
                <Card>
                  <div className="flex items-center gap-2.5 mb-4 text-sm font-bold font-[family-name:var(--font-space-grotesk)]">
                    <div className="w-[30px] h-[30px] rounded-[10px] bg-red-500/15 text-[var(--danger)] flex items-center justify-center text-sm">🛡️</div>
                    User Status
                  </div>
                  <Button variant={selectedUser.banned ? 'primary' : 'danger'} onClick={() => handleBan(!selectedUser.banned)} className="w-full">
                    {selectedUser.banned ? 'Unban User' : 'Ban User'}
                  </Button>
                </Card>
              </div>
            )}
          </>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <Card padding="sm">
            <div className="max-h-[500px] overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="text-center py-10 text-white/30">No transactions yet</div>
              ) : (
                transactions.slice(0, 50).map((t, i) => {
                  const isAdd = t.type === 'add';
                  return (
                    <div key={i} className="flex items-center gap-3 p-3.5 bg-white/[0.02] border border-white/[0.08] rounded-[14px] mb-2 hover:bg-white/[0.06] transition-colors">
                      <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-sm font-extrabold flex-shrink-0 ${isAdd ? 'bg-green-500/12 text-[var(--success)]' : 'bg-red-500/12 text-[var(--danger)]'}`}>{isAdd ? '+' : '−'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[13px] truncate">{(t.targetUserName as string) || 'Unknown'}</div>
                        <div className="text-[11px] text-white/35 mt-0.5">{typeof t.createdAt === 'string' ? t.createdAt : 'Recently'}</div>
                      </div>
                      <div className={`font-[family-name:var(--font-space-grotesk)] font-extrabold text-[15px] ${isAdd ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>{isAdd ? '+' : '-'}{String(t.amount)}</div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        )}
      </div>
      {ToastComponent}
    </div>
  );
}

async function getClientAuth() {
  const { getAuth } = await import('firebase/auth');
  const { getApp } = await import('firebase/app');
  try { return getAuth(getApp()); } catch {
    const { initializeApp } = await import('firebase/app');
    const app = initializeApp({ apiKey: 'AIzaSyDLAekP6DO0oKQQzD7USkiyCm0M3BFoyYI', authDomain: 'onchyra.firebaseapp.com', projectId: 'onchyra' });
    return getAuth(app);
  }
}
