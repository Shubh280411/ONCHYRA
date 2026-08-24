'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { detectApiUrl, formatTimeAgo } from '@/lib/utils';

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
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);
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
        id: String(u.id || u.uid || ''), name: String(u.name || ''), email: String(u.email || ''),
        balance: Number(u.balance || 0), streak: Number(u.streak || 0), lastClaim: Number(u.lastClaim || 0),
        referredBy: String(u.referredBy || ''), referralCode: String(u.referralCode || ''),
        banned: Boolean(u.banned), refLevel1: Number(u.refLevel1 || 0), refLevel2: Number(u.refLevel2 || 0), refLevel3: Number(u.refLevel3 || 0),
      })) : [];
      setAllUsers(users);
      setStatTotal(users.length);
      setStatBanned(users.filter((u) => u.banned).length);
      setStatOnc(users.reduce((s, u) => s + u.balance, 0));
      setLoading(false);
    } catch { showToast('Failed to load users', true); setLoading(false); }
  }

  const handleSearch = useCallback((val: string) => {
    setSearchQuery(val);
    setSelectedUser(null);
    if (val.length < 2) { setSearchResults([]); return; }
    const sk = val.toLowerCase();
    setSearchResults(allUsers.filter((u) =>
      (u.name && u.name.toLowerCase().includes(sk)) || (u.email && u.email.toLowerCase().includes(sk)) ||
      (u.referralCode && u.referralCode.toLowerCase().includes(sk)) || (u.id && u.id.toLowerCase().includes(sk))
    ).slice(0, 20));
  }, [allUsers]);

  async function selectUser(u: UserData) {
    setSelectedUser(u);
    setSearchResults([]);
    setSearchQuery('');
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/transactions`, { headers: { 'x-auth-uid': uid! } });
      if (res.ok) { const d = await res.json(); setTransactions(Array.isArray(d) ? d : []); }
    } catch { /* ignore */ }
  }

  async function updateBalance(isAdd: boolean) {
    if (!selectedUser || !amount || isNaN(Number(amount)) || Number(amount) <= 0) { showToast('Enter a valid amount', true); return; }
    const amt = Number(amount);
    if (!confirm(`${isAdd ? 'Add' : 'Remove'} ${amt} ONC ${isAdd ? 'to' : 'from'} ${selectedUser.name || 'user'}?`)) return;
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/user/update`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({ userId: selectedUser.id, action: isAdd ? 'add_balance' : 'remove_balance', amount: amt }),
      });
      if (!res.ok) throw new Error('Failed');
      showToast(`${amt} ONC ${isAdd ? 'added' : 'removed'}!`);
      setAmount('');
      loadUsers();
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Error', true); }
  }

  async function handleBan(ban: boolean) {
    if (!selectedUser) return;
    if (!confirm(`${ban ? 'BAN' : 'UNBAN'} ${selectedUser.name || 'user'}?`)) return;
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/user/update`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({ userId: selectedUser.id, action: 'set_banned', banned: ban }),
      });
      if (!res.ok) throw new Error('Failed');
      showToast(`User ${ban ? 'banned' : 'unbanned'}!`);
      loadUsers();
      setSelectedUser({ ...selectedUser, banned: ban });
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Error', true); }
  }

  function showToast(msg: string, error = false) {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 3000);
  }

  function handleLogout() {
    import('firebase/auth').then(({ signOut }) => {
      import('firebase/app').then(({ getApps, initializeApp }) => {
        const app = getApps().length ? getApps()[0] : initializeApp({ apiKey: 'AIzaSyDLAekP6DO0oKQQzD7USkiyCm0M3BFoyYI', authDomain: 'onchyra.firebaseapp.com', projectId: 'onchyra' });
        signOut(require('firebase/auth').getAuth(app)).then(() => router.push('/admin/login'));
      });
    });
  }

  const SvgSearch = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
  const SvgPlus = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
  const SvgMinus = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>;
  const SvgShield = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
  const SvgWallet = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 10H2"/></svg>;
  const SvgLogout = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#03040a' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(167,139,250,0.1)', borderTop: '3px solid #a78bfa', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase' as const, fontWeight: 700 }}>Loading users...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#03040a', backgroundImage: 'radial-gradient(ellipse at 20% 0%, rgba(167,139,250,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(96,165,250,0.04) 0%, transparent 50%)', color: 'white', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 16px 80px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', marginBottom: 30, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, backdropFilter: 'blur(20px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 900, fontSize: 18, color: '#000' }}>ON</div>
            <div>
              <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 800, background: 'linear-gradient(90deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>ONCHYRA Control Center</h1>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Admin Panel — User Management</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ padding: '10px 18px', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 14, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: 6 }}>
            <SvgLogout /> Logout
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Miners', value: statTotal, color: '#a78bfa' },
            { label: 'Banned', value: statBanned, color: '#fbbf24' },
            { label: 'Total ONC', value: statOnc.toFixed(1), color: '#60a5fa' },
          ].map((s) => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 18, textAlign: 'center' }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 1.5, color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>{s.label}</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 800, marginTop: 6, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, padding: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }}>
          {(['search', 'transactions'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: 12, textAlign: 'center', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: '0.2s', color: activeTab === tab ? '#a78bfa' : 'rgba(255,255,255,0.35)', border: 'none', background: activeTab === tab ? 'rgba(167,139,250,0.15)' : 'transparent', fontFamily: "'Inter', sans-serif", textTransform: 'uppercase' as const, letterSpacing: 1 }}>
              {tab === 'search' ? 'Search' : 'Transactions'}
            </button>
          ))}
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <div style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><SvgSearch /></div>
              <input
                style={{ width: '100%', padding: '16px 20px 16px 48px', borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: 14, fontWeight: 500, outline: 'none', fontFamily: "'Inter', sans-serif" }}
                placeholder="Search by name, email, referral code, UID..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                autoComplete="off"
              />
              {searchResults.length > 0 && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, width: '100%', background: '#0d0f1e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, maxHeight: 320, overflowY: 'auto', zIndex: 999, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                  {searchResults.map((u) => (
                    <div key={u.id} onClick={() => selectUser(u)} style={{ padding: '14px 18px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 14, transition: '0.15s' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(96,165,250,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 16, color: '#a78bfa', flexShrink: 0 }}>{(u.name || '?')[0].toUpperCase()}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{u.name || 'Unknown'}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{u.email || ''} · {u.referralCode || 'No code'}</div>
                      </div>
                      <div style={{ padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: 1, flexShrink: 0, background: u.banned ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)', color: u.banned ? '#ef4444' : '#22c55e', border: `1px solid ${u.banned ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}` }}>
                        {u.banned ? 'Banned' : 'Active'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile */}
            {selectedUser && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 24, marginBottom: 16, backdropFilter: 'blur(20px)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 900, fontSize: 24, color: '#000', flexShrink: 0 }}>{(selectedUser.name || '?')[0].toUpperCase()}</div>
                    <div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 800 }}>{selectedUser.name || 'Unknown'}</div>
                      <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700, marginTop: 4, letterSpacing: 1 }}>{selectedUser.referralCode}</div>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                      <div style={{ padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: 1, background: selectedUser.banned ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)', color: selectedUser.banned ? '#ef4444' : '#22c55e', border: `1px solid ${selectedUser.banned ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}` }}>
                        {selectedUser.banned ? 'BANNED' : 'ACTIVE'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    {[
                      { label: 'Balance', value: `${selectedUser.balance.toFixed(4)} ONC`, highlight: true },
                      { label: 'Streak', value: `${selectedUser.streak || 0} days` },
                      { label: 'Last Claimed', value: selectedUser.lastClaim ? formatTimeAgo(selectedUser.lastClaim) : 'Never', small: true },
                      { label: 'Referred By', value: selectedUser.referredBy || 'Direct Join', small: true },
                    ].map((d) => (
                      <div key={d.label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14 }}>
                        <div style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 1.5, color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>{d.label}</div>
                        <div style={{ fontSize: d.small ? 12 : 15, fontWeight: 700, marginTop: 6, color: d.highlight ? '#22c55e' : 'white', fontFamily: d.highlight ? "'Space Grotesk', sans-serif" : 'inherit' }}>{d.value}</div>
                      </div>
                    ))}
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, gridColumn: 'span 2' }}>
                      <div style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 1.5, color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>UID</div>
                      <div style={{ fontSize: 11, fontWeight: 700, marginTop: 6, color: 'rgba(255,255,255,0.35)', wordBreak: 'break-all' }}>{selectedUser.id}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 10 }}>Referral Network</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {[{ l: 'Level 1', v: selectedUser.refLevel1 }, { l: 'Level 2', v: selectedUser.refLevel2 }, { l: 'Level 3', v: selectedUser.refLevel3 }].map((r) => (
                      <div key={r.l} style={{ textAlign: 'center', background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.08)', borderRadius: 14, padding: 14 }}>
                        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 800, color: '#a78bfa' }}>{r.v}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, marginTop: 4 }}>{r.l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Adjust Balance */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 24, marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 10, background: 'rgba(167,139,250,0.15)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SvgWallet /></div>
                    Adjust Balance
                  </div>
                  <div style={{ position: 'relative', marginBottom: 14 }}>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" step="0.01" style={{ width: '100%', padding: '16px 50px 16px 18px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: 18, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", outline: 'none' }} />
                    <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.35)' }}>ONC</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                    {[10, 25, 50, 100, 250, 500].map((v) => (
                      <button key={v} onClick={() => setAmount(String(v))} style={{ padding: '8px 16px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}>+{v}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => updateBalance(true)} style={{ flex: 1, padding: 14, border: 'none', borderRadius: 14, background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', fontWeight: 800, fontSize: 13, cursor: 'pointer', textTransform: 'uppercase' as const, letterSpacing: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <SvgPlus /> Add ONC
                    </button>
                    <button onClick={() => updateBalance(false)} style={{ flex: 1, padding: 14, border: '1px solid rgba(239,68,68,0.15)', borderRadius: 14, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 800, fontSize: 13, cursor: 'pointer', textTransform: 'uppercase' as const, letterSpacing: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <SvgMinus /> Remove ONC
                    </button>
                  </div>
                </div>

                {/* User Status */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 24 }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 10, background: 'rgba(239,68,68,0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SvgShield /></div>
                    User Status
                  </div>
                  <button onClick={() => handleBan(!selectedUser.banned)} style={{ width: '100%', padding: 14, border: selectedUser.banned ? 'none' : '1px solid rgba(239,68,68,0.15)', borderRadius: 14, fontWeight: 800, fontSize: 13, cursor: 'pointer', textTransform: 'uppercase' as const, letterSpacing: 1, background: selectedUser.banned ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(239,68,68,0.1)', color: selectedUser.banned ? 'white' : '#ef4444' }}>
                    {selectedUser.banned ? 'Unban User' : 'Ban User'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 24 }}>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>No transactions yet</div>
              ) : (
                transactions.slice(0, 50).map((t, i) => {
                  const isAdd = t.type === 'add';
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, marginBottom: 8, transition: '0.15s' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0, background: isAdd ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: isAdd ? '#22c55e' : '#ef4444' }}>{isAdd ? '+' : '−'}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{(t.targetUserName as string) || 'Unknown'}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{typeof t.createdAt === 'string' ? t.createdAt : 'Recently'}</div>
                      </div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 15, color: isAdd ? '#22c55e' : '#ef4444' }}>{isAdd ? '+' : '-'}{String(t.amount)}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '14px 24px', borderRadius: 14, fontWeight: 700, fontSize: 13, boxShadow: '0 10px 30px rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)', background: toast.error ? 'rgba(239,68,68,0.9)' : 'rgba(34,197,94,0.9)', color: 'white', border: `1px solid ${toast.error ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`, animation: 'fadeIn 0.3s ease' }}>
          {toast.msg}
        </div>
      )}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }`}</style>
    </div>
  );
}
