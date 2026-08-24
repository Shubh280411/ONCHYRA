'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { detectApiUrl, formatTimeAgo } from '@/lib/utils';

interface WithdrawalRow {
  id: string;
  uid: string;
  userName?: string;
  amount: number;
  fee: number;
  netAmount: number;
  wallet: string;
  status: string;
  txHash?: string;
  createdAt: number;
}

export default function AdminWithdrawalsPage() {
  const { uid, loading: authLoading } = useAuth();
  const [allWithdrawals, setAllWithdrawals] = useState<WithdrawalRow[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; type: 'approve' | 'reject'; id: string }>({ open: false, type: 'approve', id: '' });
  const [txModal, setTxModal] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
  const [txHash, setTxHash] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!uid) { router.push('/admin/login'); return; }
    loadWithdrawals();
  }, [uid, authLoading]);

  async function loadWithdrawals() {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/withdrawals`, { headers: { 'x-auth-uid': uid! } });
      const data = await res.json();
      setAllWithdrawals(Array.isArray(data) ? data.map((w: Record<string, unknown>) => ({
        id: String(w.id || ''), uid: String(w.uid || ''), userName: String(w.userName || ''),
        amount: Number(w.amount || 0), fee: Number(w.fee || 0),
        netAmount: Number(w.netAmount || w.net_amount || 0), wallet: String(w.wallet || ''),
        status: String(w.status || ''), txHash: w.txHash as string | undefined,
        createdAt: Number(w.createdAt) || Number(w.created_at) || 0,
      })) : []);
      setLoading(false);
    } catch (e: unknown) {
      setError('Failed to load withdrawals: ' + (e instanceof Error ? e.message : ''));
      setLoading(false);
    }
  }

  function shortWallet(addr: string) { return (!addr || addr.length < 10) ? (addr || '-') : addr.slice(0, 6) + '...' + addr.slice(-4); }
  function formatDate(ts: number) { if (!ts) return '-'; const d = new Date(ts); return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

  function matchesSearch(w: WithdrawalRow) {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (w.uid && w.uid.toLowerCase().includes(term)) || (w.wallet && w.wallet.toLowerCase().includes(term)) || (w.userName && w.userName.toLowerCase().includes(term)) || (w.id && w.id.toLowerCase().includes(term));
  }

  const filtered = allWithdrawals.filter(matchesSearch);
  const pending = filtered.filter((w) => w.status === 'pending');
  const rest = filtered.filter((w) => w.status !== 'pending');
  const statPending = allWithdrawals.filter((w) => w.status === 'pending').length;
  const statProcessing = allWithdrawals.filter((w) => w.status === 'processing').length;
  const statCompleted = allWithdrawals.filter((w) => w.status === 'completed').length;
  const statRejected = allWithdrawals.filter((w) => w.status === 'rejected' || w.status === 'failed').length;

  function showToastMsg(msg: string, type: 'success' | 'error' | 'info' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function confirmAction() {
    if (!confirmModal.id) return;
    try {
      const apiUrl = detectApiUrl();
      const endpoint = confirmModal.type === 'approve' ? '/api/withdraw/approve' : '/api/withdraw/reject';
      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({ id: confirmModal.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || 'Request failed');
      showToastMsg(data.message || (confirmModal.type === 'approve' ? 'Approved and sent!' : 'Rejected and refunded!'));
      setConfirmModal({ open: false, type: 'approve', id: '' });
      loadWithdrawals();
    } catch (e: unknown) { showToastMsg(e instanceof Error ? e.message : 'Error', 'error'); }
  }

  async function confirmSetTx() {
    if (!txModal.id || !txHash.trim()) { showToastMsg('Enter a transaction hash', 'error'); return; }
    if (!txHash.startsWith('0x')) { showToastMsg('Hash must start with 0x', 'error'); return; }
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/withdrawal/set-tx`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({ id: txModal.id, txHash: txHash.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showToastMsg('Marked as completed with tx hash');
      setTxModal({ open: false, id: '' }); setTxHash(''); loadWithdrawals();
    } catch (e: unknown) { showToastMsg(e instanceof Error ? e.message : 'Error', 'error'); }
  }

  const statusColors: Record<string, { color: string; bg: string }> = {
    pending: { color: '#eab308', bg: 'rgba(234,179,8,0.08)' }, processing: { color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
    completed: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)' }, rejected: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)' }, failed: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  };

  const SvgRefresh = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
  const SvgBack = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>;

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#03040a' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(167,139,250,0.1)', borderTop: '3px solid #a78bfa', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase' as const, fontWeight: 700 }}>Loading withdrawals...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  );

  function renderRow(w: WithdrawalRow, showActions: boolean) {
    const net = w.netAmount || (w.amount - (w.fee || 0));
    const sc = statusColors[w.status] || { color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.05)' };
    return (
      <tr key={w.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
          <div>{formatTimeAgo(w.createdAt)}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{formatDate(w.createdAt)}</div>
        </td>
        <td style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700 }}>{w.userName || '??'}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{w.uid?.slice(0, 12)}...</div>
        </td>
        <td style={{ padding: '12px 14px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13 }}>{w.amount} <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.35)' }}>USDT</span></td>
        <td style={{ padding: '12px 14px', color: '#ef4444', fontSize: 11 }}>{w.fee || 0}</td>
        <td style={{ padding: '12px 14px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, color: '#22c55e' }}>{net}</td>
        <td style={{ padding: '12px 14px' }}><span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.35)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, display: 'inline-block' }} title={w.wallet}>{shortWallet(w.wallet)}</span></td>
        <td style={{ padding: '12px 14px' }}><span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 100, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' as const, color: sc.color, background: sc.bg }}>{w.status}</span></td>
        <td style={{ padding: '12px 14px' }}>
          {showActions ? (
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setConfirmModal({ open: true, type: 'approve', id: w.id })} style={{ padding: '6px 12px', borderRadius: 10, fontWeight: 600, fontSize: 11, cursor: 'pointer', border: 'none', background: '#22c55e', color: '#000', fontFamily: "'Inter', sans-serif" }}>Approve</button>
              <button onClick={() => setConfirmModal({ open: true, type: 'reject', id: w.id })} style={{ padding: '6px 12px', borderRadius: 10, fontWeight: 600, fontSize: 11, cursor: 'pointer', border: 'none', background: '#ef4444', color: '#fff', fontFamily: "'Inter', sans-serif" }}>Reject</button>
              <button onClick={() => { setTxModal({ open: true, id: w.id }); setTxHash(w.txHash || ''); }} style={{ padding: '6px 12px', borderRadius: 10, fontWeight: 600, fontSize: 11, cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: "'Inter', sans-serif" }}>Tx</button>
            </div>
          ) : (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{w.txHash ? <a href={`https://bscscan.com/tx/${w.txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa', textDecoration: 'none', fontSize: 11 }}>{w.txHash.slice(0, 8)}...</a> : '-'}</span>
          )}
        </td>
      </tr>
    );
  }

  const tableStyle = { width: '100%' as const, borderCollapse: 'collapse' as const, fontSize: 12 };
  const thStyle = { padding: '12px 14px', textAlign: 'left' as const, fontWeight: 600, fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 0.5, color: 'rgba(255,255,255,0.35)', borderBottom: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' as const };

  return (
    <div style={{ minHeight: '100vh', background: '#03040a', color: 'white', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px 80px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 900, fontSize: 18 }}>
            <svg viewBox="0 0 36 36" width="36" height="36"><rect width="36" height="36" rx="10" fill="url(#wg)"/><defs><linearGradient id="wg" x1="0" y1="0" x2="36" y2="36"><stop stopColor="#a78bfa"/><stop offset="1" stopColor="#60a5fa"/></linearGradient></defs><text x="18" y="24" textAnchor="middle" fill="#000" fontFamily="'Space Grotesk'" fontWeight="900" fontSize="18">W</text></svg>
            <span style={{ background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Withdrawals</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href="/admin" style={{ padding: '8px 16px', borderRadius: 10, fontWeight: 600, fontSize: 12, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}><SvgBack /> Panel</a>
          </div>
        </div>

        {error && <div style={{ padding: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, fontSize: 12, color: '#ef4444', textAlign: 'center', marginBottom: 16 }}>{error}</div>}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
          {(['pending', 'all'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: 10, textAlign: 'center', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s', color: activeTab === tab ? '#000' : 'rgba(255,255,255,0.35)', border: 'none', background: activeTab === tab ? '#a78bfa' : 'transparent', fontFamily: "'Inter', sans-serif" }}>
              {tab === 'pending' ? 'Pending' : 'All History'}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Pending', val: statPending, color: '#eab308' },
            { label: 'Processing', val: statProcessing, color: '#eab308' },
            { label: 'Completed', val: statCompleted, color: '#22c55e' },
            { label: 'Rejected', val: statRejected, color: '#ef4444' },
            { label: 'Total', val: allWithdrawals.length, color: '#a78bfa' },
          ].map((s) => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 0.5, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 20, color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input type="text" placeholder="Search by UID, wallet, or name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: 13, fontFamily: "'Inter', sans-serif", outline: 'none' }} />
          <button onClick={loadWithdrawals} style={{ padding: '8px 16px', borderRadius: 10, fontWeight: 600, fontSize: 12, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 4 }}><SvgRefresh /> Refresh</button>
        </div>

        {/* Pending Table */}
        {activeTab === 'pending' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead><tr>{['Date', 'User', 'Amount', 'Fee', 'Net', 'Wallet', 'Status', 'Actions'].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {pending.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No pending withdrawals</td></tr> : pending.map((w) => renderRow(w, true))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* All Table */}
        {activeTab === 'all' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead><tr>{['Date', 'User', 'Amount', 'Fee', 'Net', 'Wallet', 'Status', 'Tx'].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No withdrawals found</td></tr> : filtered.map((w) => renderRow(w, false))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmModal.open && (() => {
        const w = allWithdrawals.find((x) => x.id === confirmModal.id);
        if (!w) return null;
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) setConfirmModal({ open: false, type: 'approve', id: '' }); }}>
            <div style={{ background: '#0d0d23', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '28px 32px', maxWidth: 420, width: '100%' }}>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 18, marginBottom: 8, color: 'white' }}>{confirmModal.type === 'approve' ? 'Approve Withdrawal' : 'Reject Withdrawal'}</h3>
              <div style={{ fontSize: 12, marginBottom: 16 }}>
                {[
                  { label: 'User', val: w.userName || w.uid },
                  { label: 'Amount', val: `${w.amount} USDT` },
                  { label: 'Net', val: `${w.netAmount || (w.amount - w.fee)} USDT` },
                  { label: 'Wallet', val: w.wallet },
                ].map((r) => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>{r.label}</span><span>{r.val}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: 20 }}>{confirmModal.type === 'approve' ? 'USDT will be sent to the wallet above. This cannot be undone.' : "Full amount will be refunded to the user's balance."}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setConfirmModal({ open: false, type: 'approve', id: '' })} style={{ flex: 1, padding: 12, borderRadius: 14, fontWeight: 600, fontSize: 13, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', sans-serif" }}>Cancel</button>
                <button onClick={confirmAction} style={{ flex: 1, padding: 12, borderRadius: 14, fontWeight: 800, fontSize: 13, cursor: 'pointer', border: 'none', background: confirmModal.type === 'approve' ? '#22c55e' : '#ef4444', color: confirmModal.type === 'approve' ? '#000' : '#fff', fontFamily: "'Inter', sans-serif" }}>{confirmModal.type === 'approve' ? 'Approve & Send' : 'Reject & Refund'}</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tx Modal */}
      {txModal.open && (() => {
        const w = allWithdrawals.find((x) => x.id === txModal.id);
        if (!w) return null;
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) setTxModal({ open: false, id: '' }); }}>
            <div style={{ background: '#0d0d23', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '28px 32px', maxWidth: 420, width: '100%' }}>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 18, marginBottom: 8, color: 'white' }}>Set Transaction Hash</h3>
              <div style={{ fontSize: 12, marginBottom: 12 }}>
                {[
                  { label: 'User', val: w.userName || w.uid },
                  { label: 'Amount', val: `${w.amount} USDT` },
                  { label: 'Wallet', val: w.wallet },
                ].map((r) => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>{r.label}</span><span>{r.val}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>Enter the BSC transaction hash to mark as completed:</p>
              <input type="text" value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="0x..." style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", outline: 'none', marginBottom: 16 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setTxModal({ open: false, id: '' })} style={{ flex: 1, padding: 12, borderRadius: 14, fontWeight: 600, fontSize: 13, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', sans-serif" }}>Cancel</button>
                <button onClick={confirmSetTx} style={{ flex: 1, padding: 12, borderRadius: 14, fontWeight: 800, fontSize: 13, cursor: 'pointer', border: 'none', background: '#22c55e', color: '#000', fontFamily: "'Inter', sans-serif" }}>Mark Completed</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 3000, padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 13, fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' as const, background: toast.type === 'success' ? '#22c55e' : toast.type === 'error' ? '#ef4444' : '#a78bfa', color: toast.type === 'success' ? '#000' : '#fff' }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
