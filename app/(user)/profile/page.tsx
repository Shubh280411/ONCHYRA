'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl } from '@/lib/utils';
import { getAuth, signOut } from 'firebase/auth';
import Loading from '@/components/ui/Loading';

interface UserData {
  name: string;
  email: string;
  referralCode: string;
  balance: number;
  streak: number;
  refLevel1: number;
  refLevel2: number;
  refLevel3: number;
  activePackage: string;
  packageStatus: string;
  referredBy: string;
  referralUsedCode: string;
  createdAt: number;
}

const F = { sg: "'Space Grotesk',sans-serif", inter: "'Inter',sans-serif" };
const COL = {
  primary: '#a78bfa',
  secondary: '#60a5fa',
  card: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.08)',
  muted: 'rgba(255,255,255,0.35)',
};

export default function ProfilePage() {
  const { uid } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const apiUrl = detectApiUrl();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState('Loading...');

  useEffect(() => {
    if (!uid) return;
    loadData();
  }, [uid]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/user/${uid}`);
      if (res.ok) {
        const d = await res.json();
        setUserData(d);
        setNameInput(d.name || 'Validator');
      }
    } catch {}
    setLoading(false);
  }

  async function saveName() {
    const trimmed = nameInput.trim();
    if (!trimmed) { showToast('Callsign cannot be empty', 'error'); return; }
    try {
      const res = await fetch(`${apiUrl}/api/user/${uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        setUserData(prev => prev ? { ...prev, name: trimmed } : prev);
        setEditing(false);
        showToast('Callsign updated');
      }
    } catch { showToast('Update failed', 'error'); }
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/register?ref=${userData?.referralCode || ''}`).catch(() => {});
    showToast('Invite link copied');
  }

  async function logout() {
    if (!confirm('Disconnect your node from ONCHYRA?')) return;
    try {
      await signOut(getAuth());
      localStorage.removeItem('onc_uid');
      window.location.href = '/login';
    } catch { showToast('Failed to log out', 'error'); }
  }

  if (loading) return <Loading text="Loading profile..." />;

  const name = userData?.name || 'Validator';
  const initials = name.charAt(0).toUpperCase();
  const l1 = userData?.refLevel1 || 0;
  const total = l1 + (userData?.refLevel2 || 0) + (userData?.refLevel3 || 0);
  const streak = userData?.streak || 0;
  const pkgStatus = userData?.packageStatus || 'none';
  const pkgName = userData?.activePackage || null;

  let rankText = 'ROOKIE NODE';
  let rankColor = '#a78bfa';
  if (total >= 500) { rankText = 'IMMORTAL NODE'; rankColor = '#f43f5e'; }
  else if (total >= 300) { rankText = 'LEGEND NODE'; rankColor = '#f59e0b'; }
  else if (total >= 200) { rankText = 'MASTER NODE'; rankColor = '#10b981'; }
  else if (total >= 100) { rankText = 'ELITE NODE'; rankColor = '#60a5fa'; }
  else if (total >= 50) { rankText = 'RISING NODE'; rankColor = '#818cf8'; }

  const joinedDate = userData?.createdAt
    ? new Date(userData.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  const referredByCode = userData?.referredBy || userData?.referralUsedCode || null;

  const socials = [
    { href: 'https://chat.whatsapp.com/H0fPOVjfC47Fx7DQ446jqm', name: 'WhatsApp', desc: 'Community', ibg: 'rgba(37,211,102,0.1)', ib: 'rgba(37,211,102,0.15)', svg: <svg width="17" height="17" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.5 2C6.25 2 2 6.25 2 11.5c0 1.75.47 3.38 1.28 4.79L2 22l5.83-1.25C9.18 21.56 10.31 22 11.5 22c5.25 0 9.5-4.25 9.5-9.5S16.75 2 11.5 2zm0 17.5c-1.5 0-2.95-.44-4.16-1.23l-.3-.18-3.08.66.68-3-.19-.32A7.97 7.97 0 0 1 3.5 11.5C3.5 7.08 7.08 3.5 11.5 3.5S19.5 7.08 19.5 11.5 15.92 19.5 11.5 19.5z"/></svg> },
    { href: 'https://t.me/onchyra', name: 'Telegram', desc: 'Official Group', ibg: 'rgba(39,156,216,0.1)', ib: 'rgba(39,156,216,0.15)', svg: <svg width="17" height="17" viewBox="0 0 24 24" fill="#27a4d9"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.19c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.21-1.12-.32-1.08-.67.02-.18.27-.36.77-.55 3.03-1.32 5.05-2.19 6.07-2.61 2.89-1.19 3.49-1.4 3.88-1.4.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06-.01.24-.02.38z"/></svg> },
    { href: 'https://t.me/onchyraofficial', name: 'TG Channel', desc: 'Updates & Drops', ibg: 'rgba(39,156,216,0.08)', ib: 'rgba(39,156,216,0.12)', svg: <svg width="17" height="17" viewBox="0 0 24 24" fill="#27a4d9"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.19c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.21-1.12-.32-1.08-.67.02-.18.27-.36.77-.55 3.03-1.32 5.05-2.19 6.07-2.61 2.89-1.19 3.49-1.4 3.88-1.4.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06-.01.24-.02.38z"/></svg> },
    { href: 'https://www.instagram.com/onc.network', name: 'Instagram', desc: 'Follow & Earn', ibg: 'rgba(225,48,108,0.1)', ib: 'rgba(225,48,108,0.15)', svg: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#e1306c" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="#e1306c" stroke="none"/></svg> },
    { href: 'https://x.com/onchyra', name: 'X (Twitter)', desc: 'Follow @onchyra', ibg: 'rgba(255,255,255,0.06)', ib: 'rgba(255,255,255,0.1)', svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
    { href: 'https://youtube.com/@onchyra', name: 'YouTube', desc: 'Tutorials \u00b7 Announcements \u00b7 Subscribe', ibg: 'rgba(255,0,0,0.08)', ib: 'rgba(255,0,0,0.12)', svg: <svg width="17" height="17" viewBox="0 0 24 24" fill="#ff0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
  ];

  return (
    <div style={{ fontFamily: F.inter, background: '#05060f', color: 'white', padding: '16px', paddingBottom: 50, backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 60%)', minHeight: '100vh' }}>
      {ToastComponent}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingTop: 8 }}>
        <Link href="/dashboard" style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.04)', border: `1px solid ${COL.border}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
          <svg width="17" height="17" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </Link>
        <div style={{ fontFamily: F.sg, fontSize: 15, fontWeight: 800, letterSpacing: 2, color: 'rgba(255,255,255,0.8)' }}>MY NODE</div>
        <div style={{ width: 38 }} />
      </div>

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 86, height: 86, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #60a5fa)', margin: '0 auto 14px', padding: 2, boxShadow: '0 0 30px rgba(167,139,250,0.3)' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#0a0b1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.sg, fontSize: 28, fontWeight: 800, color: COL.primary }}>{initials}</div>
        </div>

        <div style={{ display: 'inline-block', padding: '5px 16px', borderRadius: 20, fontSize: 9, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: 2, marginBottom: 14, background: `${rankColor}11`, border: `1px solid ${rankColor}44`, color: rankColor }}>{rankText}</div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 5 }}>
          <input type="text" value={nameInput} readOnly={!editing} onChange={e => setNameInput(e.target.value)} style={{ fontFamily: F.sg, fontSize: 22, fontWeight: 800, border: 'none', background: 'transparent', color: 'white', textAlign: 'center', width: 'auto', maxWidth: 220, outline: 'none', borderBottom: editing ? `2px solid ${COL.primary}` : 'none', paddingBottom: editing ? 2 : 0 }} />
          <div onClick={() => setEditing(true)} style={{ cursor: 'pointer', color: COL.primary, opacity: 0.5, transition: '0.2s', width: 28, height: 28, borderRadius: 8, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 13, height: 13 }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </div>
        </div>

        <div style={{ fontSize: 9, color: COL.muted, letterSpacing: 2, marginTop: 4, textTransform: 'uppercase' as const }}>Node Activated \u2014 {joinedDate}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div style={{ background: COL.card, border: `1px solid ${COL.border}`, padding: '18px 14px', borderRadius: 20, textAlign: 'center', backdropFilter: 'blur(20px)' }}>
          <span style={{ display: 'block', fontFamily: F.sg, fontSize: 22, fontWeight: 800, color: '#10b981' }}>{total}</span>
          <span style={{ fontSize: 9, color: COL.muted, textTransform: 'uppercase' as const, letterSpacing: 1, marginTop: 5, display: 'block' }}>Network Size</span>
        </div>
        <div style={{ background: COL.card, border: `1px solid ${COL.border}`, padding: '18px 14px', borderRadius: 20, textAlign: 'center', backdropFilter: 'blur(20px)' }}>
          <span style={{ display: 'block', fontFamily: F.sg, fontSize: 22, fontWeight: 800, color: '#10b981' }}>{(userData?.balance || 0).toFixed(2)} ONC</span>
          <span style={{ fontSize: 9, color: COL.muted, textTransform: 'uppercase' as const, letterSpacing: 1, marginTop: 5, display: 'block' }}>ONC Mined</span>
        </div>
      </div>

      <div style={{ background: COL.card, border: `1px solid ${COL.border}`, borderRadius: 20, padding: '6px 18px', marginBottom: 14, backdropFilter: 'blur(20px)' }}>
        {([
          { label: 'Node Address', value: userData?.email || '\u2014', style: {} },
          { label: 'Invite Code', value: userData?.referralCode || '\u2014', style: { color: COL.primary, letterSpacing: 2 } },
          { label: 'Mining Streak', value: `${streak} days`, style: {} },
          { label: 'Direct Referrals', value: `${l1} validators`, style: {} },
        ] as { label: string; value: string; style: React.CSSProperties }[]).map((row, i, arr) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', gap: 12 }}>
            <span style={{ fontSize: 11, color: COL.muted, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: COL.primary, opacity: 0.5, flexShrink: 0 }} />
              {row.label}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', textAlign: 'right', wordBreak: 'break-all' as const, ...row.style }}>{row.value}</span>
          </div>
        ))}
      </div>

      {referredByCode && (
        <div style={{ background: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: 18, padding: '14px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14, backdropFilter: 'blur(20px)' }}>
          <div style={{ width: 3, height: 36, background: 'linear-gradient(to bottom,#60a5fa,#7c3aed)', borderRadius: 10, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 9, color: 'rgba(96,165,250,0.6)', textTransform: 'uppercase' as const, letterSpacing: 2, marginBottom: 4 }}>Recruited By</div>
            <div style={{ fontFamily: F.sg, fontSize: 14, fontWeight: 800, color: COL.secondary }}>Code: {referredByCode}</div>
            <div style={{ fontSize: 10, color: COL.muted, marginTop: 2 }}>They brought you into the ONCHYRA network</div>
          </div>
        </div>
      )}

      <div style={{ background: COL.card, border: '1px solid rgba(167,139,250,0.12)', borderRadius: 20, padding: '6px 18px', marginBottom: 14, backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', gap: 12 }}>
          <span style={{ fontSize: 11, color: COL.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: COL.primary, opacity: 0.5 }} />
            Active Package
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: pkgStatus === 'active' ? '#22c55e' : pkgStatus === 'expired' ? '#ef4444' : 'rgba(255,255,255,0.3)' }}>
              {pkgStatus === 'active' && pkgName ? `${pkgName} \u2713` : pkgStatus === 'expired' ? 'Expired' : 'None'}
            </span>
            {(pkgStatus !== 'active' || !pkgName) && (
              <Link href="/packages" style={{ padding: '6px 14px', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', color: '#fff', fontSize: 10, fontWeight: 800, textDecoration: 'none', letterSpacing: 1, display: 'inline-flex', alignItems: 'center', gap: 4 }}>BUY \u2192</Link>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <button onClick={saveName} style={{ width: '100%', padding: 15, borderRadius: 16, border: 'none', background: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', marginBottom: 12, fontFamily: F.sg, letterSpacing: 2 }}>SAVE CALLSIGN</button>
      )}

      <button onClick={copyLink} style={{ width: '100%', padding: 16, borderRadius: 16, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', marginBottom: 20, fontFamily: F.sg, letterSpacing: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16, opacity: 0.8 }}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        BROADCAST INVITE LINK
      </button>

      <div style={{ fontSize: 9, color: COL.muted, textTransform: 'uppercase' as const, letterSpacing: 3, fontWeight: 700, marginBottom: 12 }}>Join the Network</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {socials.map((s, i) => (
          <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" style={{ padding: '14px 12px', borderRadius: 16, border: `1px solid ${COL.border}`, background: COL.card, color: 'white', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', backdropFilter: 'blur(20px)' }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: s.ibg, border: `1px solid ${s.ib}` }}>{s.svg}</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{s.name}</span>
              <span style={{ fontSize: 9, color: COL.muted, marginTop: 2 }}>{s.desc}</span>
            </div>
          </a>
        ))}
      </div>

      <button onClick={logout} style={{ width: '100%', padding: 13, border: '1px solid rgba(239,68,68,0.15)', background: 'transparent', borderRadius: 14, color: 'rgba(239,68,68,0.6)', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase' as const, fontFamily: F.sg }}>Disconnect Node</button>
    </div>
  );
}
