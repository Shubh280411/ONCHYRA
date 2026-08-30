'use client';

import { useEffect, useState, useCallback } from 'react';
import { detectApiUrl, formatTimeAgo } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';

const PKG_MAP: Record<string, { name: string; price: number; boost: number; cap: number; color: string }> = {
  starter: { name: 'Starter', price: 5, boost: 4, cap: 50, color: '#60a5fa' },
  builder: { name: 'Builder', price: 10, boost: 8, cap: 100, color: '#22c55e' },
  pioneer: { name: 'Pioneer', price: 25, boost: 15, cap: 250, color: '#fbbf24' },
  elite: { name: 'Elite', price: 50, boost: 30, cap: 500, color: '#a78bfa' },
  titan: { name: 'Titan', price: 100, boost: 60, cap: 1000, color: '#f472b6' },
  dominion: { name: 'Dominion', price: 250, boost: 120, cap: 2500, color: '#fb923c' },
  legacy: { name: 'Legacy', price: 500, boost: 300, cap: 5000, color: '#ef4444' },
};

const RANKS = ['member', 'scout', 'ambassador', 'regional', 'global', 'top'];

interface UserData {
  uid: string;
  name: string;
  email: string;
  balance: number;
  walletBalance: number;
  streak: number;
  lastClaim: number;
  referredBy: string;
  referralCode: string;
  banned: boolean;
  roiEnabled: boolean;
  refLevel1: number;
  refLevel2: number;
  refLevel3: number;
  activePackage: string;
  packageAmount: number;
  packageBoost: number;
  packageCap: number;
  packageUsage: number;
  packageStatus: string;
  packagePurchasedAt: number;
  rank: string;
  totalCommissions: number;
  commissionBalance: number;
  teamBiz: number;
  createdAt: number;
}

const S = {
  card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 },
  input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: "'Inter',sans-serif" },
  btn: { padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: "'Inter',sans-serif" as const, transition: 'all 0.2s' },
  statLabel: { fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 1.2, color: 'rgba(255,255,255,0.35)', fontWeight: 700, marginBottom: 4 },
  statValue: { fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 800 },
  sectionTitle: { fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex' as const, alignItems: 'center' as const, gap: 8, color: '#fff' },
};

export default function AdminUsersPage() {
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserData[]>([]);
  const [selected, setSelected] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);

  const [adjustAmt, setAdjustAmt] = useState('');
  const [adjustMode, setAdjustMode] = useState<'onc' | 'usdt'>('onc');
  const [pkgSelect, setPkgSelect] = useState('starter');
  const [rankSelect, setRankSelect] = useState('member');
  const [capReset, setCapReset] = useState(false);
  const [banModal, setBanModal] = useState(false);
  const [banReason, setBanReason] = useState('');

  const showToast = (msg: string, err = false) => { setToast({ msg, err }); setTimeout(() => setToast(null), 3000); };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl = detectApiUrl();
      const uid = typeof window !== 'undefined' ? document.cookie.match(/onc_uid=([^;]+)/)?.[1] : null;
      if (!uid) return;
      const res = await fetch(`${apiUrl}/api/admin/users`, { headers: { 'x-auth-uid': uid } });
      if (res.ok) {
        const data = await res.json();
        const users: UserData[] = Array.isArray(data) ? data.map((u: Record<string, unknown>) => ({
          uid: String(u.uid || u.id || ''),
          name: String(u.name || ''),
          email: String(u.email || ''),
          balance: Number(u.balance || 0),
          walletBalance: Number(u.walletBalance || u.wallet_balance || 0),
          streak: Number(u.streak || 0),
          lastClaim: Number(u.lastClaim || u.last_claim || 0),
          referredBy: String(u.referredBy || u.referred_by || ''),
          referralCode: String(u.referralCode || u.referral_code || ''),
          banned: Boolean(u.banned),
          roiEnabled: u.roi_enabled === true,
          refLevel1: Number(u.refLevel1 || u.ref_level1 || 0),
          refLevel2: Number(u.refLevel2 || u.ref_level2 || 0),
          refLevel3: Number(u.refLevel3 || u.ref_level3 || 0),
          activePackage: String(u.activePackage || u.active_package || ''),
          packageAmount: Number(u.packageAmount || u.package_amount || 0),
          packageBoost: Number(u.packageBoost || u.package_boost || 1),
          packageCap: Number(u.packageCap || u.package_cap || 0),
          packageUsage: Number(u.packageUsage || u.package_usage || 0),
          packageStatus: String(u.packageStatus || u.package_status || ''),
          packagePurchasedAt: Number(u.packagePurchasedAt || u.package_purchased_at || 0),
          rank: String(u.rank || 'member'),
          totalCommissions: Number(u.totalCommissions || u.total_commissions || 0),
          commissionBalance: Number(u.commissionBalance || u.commission_balance || 0),
          teamBiz: Number(u.teamBiz || u.team_biz || 0),
          createdAt: Number(u.createdAt || u.created_at || 0),
        })) : [];
        setAllUsers(users);
      }
    } catch { showToast('Failed to load users', true); }
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleSearch = useCallback((val: string) => {
    setSearchQuery(val);
    setSelected(null);
    if (val.length < 2) { setSearchResults([]); return; }
    const sk = val.toLowerCase();
    setSearchResults(allUsers.filter(u =>
      u.name.toLowerCase().includes(sk) || u.email.toLowerCase().includes(sk) ||
      u.referralCode.toLowerCase().includes(sk) || u.uid.toLowerCase().includes(sk)
    ).slice(0, 20));
  }, [allUsers]);

  function selectUser(u: UserData) {
    setSelected(u);
    setSearchResults([]);
    setSearchQuery('');
    setPkgSelect(u.activePackage || 'starter');
    setRankSelect(u.rank || 'member');
    setCapReset(false);
    setAdjustAmt('');
  }

  async function apiUpdate(updates: Record<string, unknown>) {
    const apiUrl = detectApiUrl();
    const uid = typeof window !== 'undefined' ? document.cookie.match(/onc_uid=([^;]+)/)?.[1] : null;
    if (!uid || !selected) return false;
    const res = await fetch(`${apiUrl}/api/admin/user/update`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid },
      body: JSON.stringify({ uid: selected.uid, updates }),
    });
    return res.ok;
  }

  async function adjustBalance() {
    if (!selected || !adjustAmt || Number(adjustAmt) <= 0) { showToast('Enter valid amount', true); return; }
    const amt = Number(adjustAmt);
    const field = adjustMode === 'onc' ? 'balance' : 'walletBalance';
    const current = adjustMode === 'onc' ? selected.balance : selected.walletBalance;
    const newVal = current + amt;
    if (!confirm(`Add ${amt} ${adjustMode.toUpperCase()} to ${selected.name}?`)) return;
    const ok = await apiUpdate({ [field]: newVal });
    if (ok) {
      showToast(`${amt} ${adjustMode.toUpperCase()} added!`);
      setSelected({ ...selected, [field]: newVal });
      setAdjustAmt('');
      loadUsers();
    } else showToast('Update failed', true);
  }

  async function removeBalance() {
    if (!selected || !adjustAmt || Number(adjustAmt) <= 0) { showToast('Enter valid amount', true); return; }
    const amt = Number(adjustAmt);
    const field = adjustMode === 'onc' ? 'balance' : 'walletBalance';
    const current = adjustMode === 'onc' ? selected.balance : selected.walletBalance;
    if (amt > current) { showToast('Amount exceeds balance', true); return; }
    if (!confirm(`Remove ${amt} ${adjustMode.toUpperCase()} from ${selected.name}?`)) return;
    const ok = await apiUpdate({ [field]: current - amt });
    if (ok) {
      showToast(`${amt} ${adjustMode.toUpperCase()} removed!`);
      setSelected({ ...selected, [field]: current - amt });
      setAdjustAmt('');
      loadUsers();
    } else showToast('Update failed', true);
  }

  async function activatePackage() {
    if (!selected) return;
    if (!confirm(`Activate ${PKG_MAP[pkgSelect]?.name || pkgSelect} for ${selected.name}?`)) return;
    const apiUrl = detectApiUrl();
    const uid = typeof window !== 'undefined' ? document.cookie.match(/onc_uid=([^;]+)/)?.[1] : null;
    const res = await fetch(`${apiUrl}/api/admin/package/activate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
      body: JSON.stringify({ uid: selected.uid, packageId: pkgSelect }),
    });
    if (res.ok) {
      const pkg = PKG_MAP[pkgSelect];
      showToast(`Package activated!`);
      setSelected({ ...selected, activePackage: pkgSelect, packageCap: pkg?.cap || 0, packageUsage: 0, packageStatus: 'active', packageBoost: pkg?.boost || 1 });
      loadUsers();
    } else showToast('Activation failed', true);
  }

  async function resetCapping() {
    if (!selected) return;
    if (!confirm(`Reset capping for ${selected.name}?`)) return;
    const ok = await apiUpdate({ packageUsage: 0 });
    if (ok) {
      showToast('Capping reset!');
      setSelected({ ...selected, packageUsage: 0 });
      loadUsers();
    } else showToast('Reset failed', true);
  }

  async function updateRank() {
    if (!selected) return;
    const ok = await apiUpdate({ rank: rankSelect });
    if (ok) {
      showToast(`Rank updated to ${rankSelect}`);
      setSelected({ ...selected, rank: rankSelect });
      loadUsers();
    } else showToast('Rank update failed', true);
  }

  async function toggleBan() {
    if (!selected) return;
    const apiUrl = detectApiUrl();
    const adminUid = typeof window !== 'undefined' ? document.cookie.match(/onc_uid=([^;]+)/)?.[1] : null;
    if (selected.banned) {
      const res = await fetch(`${apiUrl}/api/admin/bans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': adminUid || '' },
        body: JSON.stringify({ uid: selected.uid, action: 'unban' }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('User unbanned!');
        setSelected({ ...selected, banned: false });
        loadUsers();
      } else {
        showToast(data.error || 'Failed to unban', true);
      }
    } else {
      setBanModal(true);
    }
  }

  async function toggleRoi() {
    if (!selected) return;
    const apiUrl = detectApiUrl();
    const adminUid = typeof window !== 'undefined' ? document.cookie.match(/onc_uid=([^;]+)/)?.[1] : null;
    const newVal = !selected.roiEnabled;
    const res = await fetch(`${apiUrl}/api/admin/user/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-uid': adminUid || '' },
      body: JSON.stringify({ uid: selected.uid, updates: { roiEnabled: newVal } }),
    });
    if (res.ok) {
      showToast(newVal ? 'ROI Enabled!' : 'ROI Disabled!');
      setSelected({ ...selected, roiEnabled: newVal });
      loadUsers();
    }
  }

  async function confirmBan() {
    if (!selected || !banReason.trim()) return;
    const apiUrl = detectApiUrl();
    const adminUid = typeof window !== 'undefined' ? document.cookie.match(/onc_uid=([^;]+)/)?.[1] : null;
    const res = await fetch(`${apiUrl}/api/admin/bans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-uid': adminUid || '' },
      body: JSON.stringify({ uid: selected.uid, action: 'ban', reason: banReason.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast('User banned!');
      setSelected({ ...selected, banned: true });
      setBanModal(false);
      setBanReason('');
      loadUsers();
    } else {
      showToast(data.error || 'Failed to ban user', true);
    }
  }

  const totalUsers = allUsers.length;
  const totalOnc = allUsers.reduce((s, u) => s + u.balance, 0);
  const totalUsdt = allUsers.reduce((s, u) => s + u.walletBalance, 0);
  const activePkgs = allUsers.filter(u => u.activePackage && u.packageStatus === 'active').length;

  return (
    <AdminLayout title="User Management">
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '14px 24px', borderRadius: 12, background: toast.err ? 'rgba(239,68,68,0.9)' : 'rgba(34,197,94,0.9)', color: '#fff', fontSize: 14, fontWeight: 600, backdropFilter: 'blur(12px)' }}>
          {toast.msg}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Users', value: totalUsers, color: '#a78bfa' },
          { label: 'Active Packages', value: activePkgs, color: '#22c55e' },
          { label: 'Total ONC', value: totalOnc.toFixed(1), color: '#60a5fa' },
          { label: 'Total USDT', value: `${totalUsdt.toFixed(2)}`, color: '#fbbf24' },
        ].map(s => (
          <div key={s.label} style={{ ...S.card, textAlign: 'center' as const }}>
            <div style={S.statLabel}>{s.label}</div>
            <div style={{ ...S.statValue, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        </div>
        <input
          style={{ ...S.input, padding: '14px 16px 14px 44px', fontSize: 14 }}
          placeholder="Search by name, email, UID, or referral code..."
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
        />
        {searchResults.length > 0 && (
          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%', background: '#0d0f1e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, maxHeight: 320, overflowY: 'auto', zIndex: 999, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            {searchResults.map(u => (
              <div key={u.uid} onClick={() => selectUser(u)} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(96,165,250,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#a78bfa', flexShrink: 0 }}>
                  {(u.name || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{u.name || 'Unknown'}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{u.email || u.uid.slice(0, 12)}</div>
                </div>
                <div style={{ textAlign: 'right' as const }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>{u.balance.toFixed(2)} ONC</div>
                  {u.activePackage && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{PKG_MAP[u.activePackage]?.name || u.activePackage}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected User Profile */}
      {selected && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* LEFT: User Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header */}
            <div style={S.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 900, fontSize: 22, color: '#000', flexShrink: 0 }}>
                  {(selected.name || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 800 }}>{selected.name || 'Unknown'}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{selected.email}</div>
                </div>
                <div style={{ padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: 1, background: selected.banned ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)', color: selected.banned ? '#ef4444' : '#22c55e', border: `1px solid ${selected.banned ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}` }}>
                  {selected.banned ? 'BANNED' : 'ACTIVE'}
                </div>
              </div>
              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1 }}>UID</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', wordBreak: 'break-all', marginTop: 4, fontFamily: 'monospace' }}>{selected.uid}</div>
              </div>
            </div>

            {/* Balances */}
            <div style={S.card}>
              <div style={S.sectionTitle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" /></svg>
                Balances
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ padding: '14px', background: 'rgba(34,197,94,0.06)', borderRadius: 12, border: '1px solid rgba(34,197,94,0.1)' }}>
                  <div style={S.statLabel}>ONC Balance</div>
                  <div style={{ ...S.statValue, color: '#22c55e', fontSize: 22 }}>{selected.balance.toFixed(4)}</div>
                </div>
                <div style={{ padding: '14px', background: 'rgba(251,191,36,0.06)', borderRadius: 12, border: '1px solid rgba(251,191,36,0.1)' }}>
                  <div style={S.statLabel}>USDT Balance</div>
                  <div style={{ ...S.statValue, color: '#fbbf24', fontSize: 22 }}>{selected.walletBalance.toFixed(2)}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
                  <div style={S.statLabel}>Commission Balance</div>
                  <div style={{ ...S.statValue, color: '#60a5fa', fontSize: 15 }}>{selected.commissionBalance.toFixed(4)}</div>
                </div>
                <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
                  <div style={S.statLabel}>Total Earned</div>
                  <div style={{ ...S.statValue, color: '#a78bfa', fontSize: 15 }}>{selected.totalCommissions.toFixed(4)}</div>
                </div>
              </div>
            </div>

            {/* Package Info */}
            <div style={S.card}>
              <div style={S.sectionTitle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
                Package
              </div>
              {selected.activePackage && selected.activePackage !== 'none' ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ padding: '6px 14px', borderRadius: 8, background: (PKG_MAP[selected.activePackage]?.color || '#666') + '20', color: PKG_MAP[selected.activePackage]?.color || '#666', fontSize: 14, fontWeight: 800 }}>
                      {PKG_MAP[selected.activePackage]?.name || selected.activePackage}
                    </div>
                    <div style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: selected.packageStatus === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: selected.packageStatus === 'active' ? '#22c55e' : '#ef4444', textTransform: 'uppercase' as const }}>
                      {selected.packageStatus || 'unknown'}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, textAlign: 'center' as const }}>
                      <div style={S.statLabel}>Boost</div>
                      <div style={{ ...S.statValue, color: '#a78bfa', fontSize: 16 }}>{selected.packageBoost}x</div>
                    </div>
                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, textAlign: 'center' as const }}>
                      <div style={S.statLabel}>Price</div>
                      <div style={{ ...S.statValue, color: '#fbbf24', fontSize: 16 }}>${selected.packageAmount}</div>
                    </div>
                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, textAlign: 'center' as const }}>
                      <div style={S.statLabel}>Cap</div>
                      <div style={{ ...S.statValue, color: '#60a5fa', fontSize: 16 }}>{selected.packageCap}</div>
                    </div>
                  </div>
                  {/* Capping Bar */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Capping Used</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24' }}>{selected.packageUsage.toFixed(2)} / {selected.packageCap}</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (selected.packageUsage / Math.max(1, selected.packageCap)) * 100)}%`, background: 'linear-gradient(90deg, #22c55e, #fbbf24)', borderRadius: 3, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                  <button onClick={resetCapping} style={{ ...S.btn, width: '100%', background: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)', fontSize: 12 }}>
                    Reset Capping
                  </button>
                </>
              ) : (
                <div style={{ padding: 20, textAlign: 'center' as const, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No Active Package</div>
              )}
            </div>

            {/* Rank & Sponsor */}
            <div style={S.card}>
              <div style={S.sectionTitle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                Rank & Sponsor
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div style={{ padding: '12px', background: 'rgba(251,191,36,0.06)', borderRadius: 10, border: '1px solid rgba(251,191,36,0.1)' }}>
                  <div style={S.statLabel}>Current Rank</div>
                  <div style={{ ...S.statValue, color: '#fbbf24', fontSize: 15, textTransform: 'capitalize' as const }}>{selected.rank || 'Member'}</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={S.statLabel}>Sponsor</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginTop: 4, wordBreak: 'break-all' }}>{selected.referredBy || 'Direct Join'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <select style={{ ...S.input, flex: 1, cursor: 'pointer' }} value={rankSelect} onChange={e => setRankSelect(e.target.value)}>
                  {RANKS.map(r => <option key={r} value={r} style={{ background: '#0d0f1e' }}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
                <button onClick={updateRank} style={{ ...S.btn, background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>Set Rank</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[{ l: 'L1', v: selected.refLevel1 }, { l: 'L2', v: selected.refLevel2 }, { l: 'L3', v: selected.refLevel3 }].map(r => (
                  <div key={r.l} style={{ textAlign: 'center' as const, padding: '10px', background: 'rgba(167,139,250,0.04)', borderRadius: 8, border: '1px solid rgba(167,139,250,0.08)' }}>
                    <div style={{ ...S.statValue, color: '#a78bfa', fontSize: 18 }}>{r.v}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{r.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Adjust Balance */}
            <div style={S.card}>
              <div style={S.sectionTitle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Adjust Balance
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {(['onc', 'usdt'] as const).map(m => (
                  <button key={m} onClick={() => setAdjustMode(m)} style={{ ...S.btn, flex: 1, background: adjustMode === m ? (m === 'onc' ? 'rgba(34,197,94,0.15)' : 'rgba(251,191,36,0.15)') : 'rgba(255,255,255,0.03)', color: adjustMode === m ? (m === 'onc' ? '#22c55e' : '#fbbf24') : 'rgba(255,255,255,0.3)', border: `1px solid ${adjustMode === m ? (m === 'onc' ? 'rgba(34,197,94,0.3)' : 'rgba(251,191,36,0.3)') : 'rgba(255,255,255,0.06)'}` }}>
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <input type="number" step="0.01" min="0" value={adjustAmt} onChange={e => setAdjustAmt(e.target.value)} placeholder="0.00" style={{ ...S.input, fontSize: 18, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", paddingRight: 60 }} />
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.3)' }}>{adjustMode.toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                {[10, 25, 50, 100, 250, 500].map(v => (
                  <button key={v} onClick={() => setAdjustAmt(String(v))} style={{ ...S.btn, padding: '6px 12px', fontSize: 11, background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>+{v}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={adjustBalance} style={{ ...S.btn, flex: 1, background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff' }}>Add</button>
                <button onClick={removeBalance} style={{ ...S.btn, flex: 1, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>Remove</button>
              </div>
            </div>

            {/* Activate Package */}
            <div style={S.card}>
              <div style={S.sectionTitle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
                Activate Package
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {Object.entries(PKG_MAP).map(([id, p]) => (
                  <button key={id} onClick={() => setPkgSelect(id)} style={{ ...S.btn, padding: '6px 10px', fontSize: 11, background: pkgSelect === id ? p.color + '25' : 'rgba(255,255,255,0.03)', color: pkgSelect === id ? p.color : 'rgba(255,255,255,0.3)', border: `1px solid ${pkgSelect === id ? p.color + '40' : 'rgba(255,255,255,0.06)'}` }}>
                    {p.name}
                  </button>
                ))}
              </div>
              {PKG_MAP[pkgSelect] && (
                <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, marginBottom: 14, fontSize: 12 }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Price: </span>
                  <span style={{ color: '#fbbf24', fontWeight: 700 }}>${PKG_MAP[pkgSelect].price}</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)' }}> | </span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Boost: </span>
                  <span style={{ color: '#a78bfa', fontWeight: 700 }}>{PKG_MAP[pkgSelect].boost}x</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)' }}> | </span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Cap: </span>
                  <span style={{ color: '#60a5fa', fontWeight: 700 }}>{PKG_MAP[pkgSelect].cap}</span>
                </div>
              )}
              <button onClick={activatePackage} style={{ ...S.btn, width: '100%', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#fff', padding: 12 }}>
                Activate Package
              </button>
            </div>

            {/* Quick Info */}
            <div style={S.card}>
              <div style={S.sectionTitle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                Quick Info
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { l: 'Streak', v: `${selected.streak || 0} days`, c: '#fbbf24' },
                  { l: 'Last Claim', v: selected.lastClaim ? formatTimeAgo(selected.lastClaim) : 'Never', c: 'rgba(255,255,255,0.5)' },
                  { l: 'Team Biz', v: `${selected.teamBiz || 0} ONC`, c: '#a78bfa' },
                  { l: 'Joined', v: selected.createdAt ? formatTimeAgo(selected.createdAt) : 'Unknown', c: 'rgba(255,255,255,0.5)' },
                ].map(i => (
                  <div key={i.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{i.l}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: i.c }}>{i.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ROI Toggle */}
            <div style={{ ...S.card, borderColor: 'rgba(34,197,94,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Daily ROI Auto-Credit</span>
                </div>
                <div style={{
                  width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                  background: selected.roiEnabled
                    ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(255,255,255,0.1)',
                  position: 'relative', transition: '0.3s',
                  border: selected.roiEnabled
                    ? 'none' : '1px solid rgba(255,255,255,0.15)',
                }} onClick={toggleRoi}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 10, background: '#fff',
                    position: 'absolute', top: 2, transition: '0.3s',
                    left: selected.roiEnabled ? 22 : 2,
                  }} />
                </div>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                {selected.roiEnabled
                  ? 'ROI is ON — daily 1% auto-credits at 12:00 UTC'
                  : 'ROI is OFF — user will not receive daily auto-credits'}
              </div>
            </div>

            {/* Ban/Unban */}
            <div style={{ ...S.card, borderColor: 'rgba(239,68,68,0.15)' }}>
              <button onClick={toggleBan} style={{ ...S.btn, width: '100%', background: selected.banned ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(239,68,68,0.12)', color: selected.banned ? '#fff' : '#ef4444', border: selected.banned ? 'none' : '1px solid rgba(239,68,68,0.2)', padding: 12 }}>
                {selected.banned ? 'Unban User' : 'Ban User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!selected && !loading && (
        <div style={{ ...S.card, textAlign: 'center' as const, padding: 60, color: 'rgba(255,255,255,0.3)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <div style={{ fontSize: 14 }}>Search for a user to view their profile and manage their account</div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center' as const, padding: 60 }}>
          <div style={{ width: 32, height: 32, border: '3px solid rgba(167,139,250,0.1)', borderTop: '3px solid #a78bfa', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Loading users...</div>
        </div>
      )}

      {banModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 400, background: '#0d0e1a', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 20, padding: 28 }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: '#ef4444', marginBottom: 4 }}>Ban User</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Banning: <span style={{ color: '#fff', fontWeight: 600 }}>{selected?.name}</span></div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>This will immediately block the user from accessing the platform.</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Reason for ban:</div>
            <textarea value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Enter reason for banning this user..."
              style={{ width: '100%', minHeight: 80, padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: "'Inter',sans-serif" }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={() => { setBanModal(false); setBanReason(''); }} style={{ flex: 1, padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Cancel</button>
              <button disabled={!banReason.trim()} onClick={confirmBan} style={{
                flex: 1, padding: 12, borderRadius: 12, border: 'none',
                background: banReason.trim() ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                color: banReason.trim() ? '#ef4444' : 'rgba(255,255,255,0.3)',
                fontSize: 13, fontWeight: 700, cursor: banReason.trim() ? 'pointer' : 'not-allowed', fontFamily: "'Inter',sans-serif",
              }}>Ban User</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
