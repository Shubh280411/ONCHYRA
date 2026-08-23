'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl, formatTimeAgo } from '@/lib/utils';
import Loading from '@/components/ui/Loading';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

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
  const { showToast, ToastComponent } = useToast();
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
        id: String(w.id || ''),
        uid: String(w.uid || ''),
        userName: String(w.userName || ''),
        amount: Number(w.amount || 0),
        fee: Number(w.fee || 0),
        netAmount: Number(w.netAmount || w.net_amount || 0),
        wallet: String(w.wallet || ''),
        status: String(w.status || ''),
        txHash: w.txHash as string | undefined,
        createdAt: Number(w.createdAt) || Number(w.created_at) || 0,
      })) : []);
      setLoading(false);
    } catch (e: unknown) {
      setError('Failed to load withdrawals: ' + (e instanceof Error ? e.message : ''));
      setLoading(false);
    }
  }

  function shortWallet(addr: string) {
    if (!addr || addr.length < 10) return addr || '-';
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  }

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

  function formatDate(ts: number) {
    if (!ts) return '-';
    const d = new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  async function confirmAction() {
    if (!confirmModal.id) return;
    try {
      const apiUrl = detectApiUrl();
      const endpoint = confirmModal.type === 'approve' ? '/api/withdraw/approve' : '/api/withdraw/reject';
      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({ id: confirmModal.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || 'Request failed');
      showToast(data.message || (confirmModal.type === 'approve' ? 'Approved and sent!' : 'Rejected and refunded!'));
      setConfirmModal({ open: false, type: 'approve', id: '' });
      loadWithdrawals();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    }
  }

  async function confirmSetTx() {
    if (!txModal.id || !txHash.trim()) { showToast('Enter a transaction hash', 'error'); return; }
    if (!txHash.startsWith('0x')) { showToast('Hash must start with 0x', 'error'); return; }
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/withdrawal/set-tx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({ id: txModal.id, txHash: txHash.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showToast('Marked as completed with tx hash');
      setTxModal({ open: false, id: '' });
      setTxHash('');
      loadWithdrawals();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    }
  }

  function renderRow(w: WithdrawalRow, showActions: boolean) {
    const net = w.netAmount || (w.amount - (w.fee || 0));
    const statusColors: Record<string, string> = { pending: 'text-yellow-500 bg-yellow-500/8', processing: 'text-[var(--primary)] bg-[var(--primary)]/8', completed: 'text-green-500 bg-green-500/8', rejected: 'text-red-500 bg-red-500/8', failed: 'text-red-500 bg-red-500/8' };
    const sc = statusColors[w.status] || 'text-white/50 bg-white/5';

    return (
      <tr key={w.id} className="border-b border-white/[0.03] hover:bg-white/[0.06] transition-colors">
        <td className="py-3 px-3.5 whitespace-nowrap">
          <div>{formatTimeAgo(w.createdAt)}</div>
          <div className="text-[10px] text-white/35">{formatDate(w.createdAt)}</div>
        </td>
        <td className="py-3 px-3.5">
          <div className="text-[11px] font-bold">{w.userName || '??'}</div>
          <div className="text-[9px] text-white/35 font-mono">{w.uid?.slice(0, 12)}...</div>
        </td>
        <td className="py-3 px-3.5 font-[family-name:var(--font-space-grotesk)] font-bold text-[13px]">{w.amount} <span className="text-[10px] font-normal text-white/35">USDT</span></td>
        <td className="py-3 px-3.5 text-[var(--danger)] text-[11px]">{w.fee || 0}</td>
        <td className="py-3 px-3.5 font-[family-name:var(--font-space-grotesk)] font-bold text-[13px] text-green-500">{net}</td>
        <td className="py-3 px-3.5"><span className="font-[family-name:var(--font-space-grotesk)] text-[11px] text-white/35 max-w-[120px] truncate inline-block align-middle" title={w.wallet}>{shortWallet(w.wallet)}</span></td>
        <td className="py-3 px-3.5"><span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${sc}`}>{w.status}</span></td>
        <td className="py-3 px-3.5">
          {showActions ? (
            <div className="flex gap-1">
              <Button size="sm" className="!bg-green-500 !text-black !border-none" onClick={() => setConfirmModal({ open: true, type: 'approve', id: w.id })}>Approve</Button>
              <Button variant="danger" size="sm" onClick={() => setConfirmModal({ open: true, type: 'reject', id: w.id })}>Reject</Button>
              <Button variant="secondary" size="sm" onClick={() => { setTxModal({ open: true, id: w.id }); setTxHash(w.txHash || ''); }}>Tx</Button>
            </div>
          ) : (
            <span className="text-[10px] text-white/35">{w.txHash ? <a href={`https://bscscan.com/tx/${w.txHash}`} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] no-underline text-[11px]">{w.txHash.slice(0, 8)}...</a> : '-'}</span>
          )}
        </td>
      </tr>
    );
  }

  if (loading) return <Loading text="Loading withdrawals..." />;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-[1100px] mx-auto p-5 pb-20">
        <div className="flex justify-between items-center py-4 border-b border-white/[0.08] mb-6">
          <div className="flex items-center gap-3 font-[family-name:var(--font-space-grotesk)] font-black text-lg">
            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">Withdrawals</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => router.push('/admin')}>Panel</Button>
          </div>
        </div>

        {error && <div className="py-3 bg-red-500/8 border border-red-500/20 rounded-xl text-xs text-[var(--danger)] text-center mb-4">{error}</div>}

        <div className="flex gap-1 mb-5 bg-white/[0.03] p-1 rounded-xl border border-white/[0.08]">
          <button onClick={() => setActiveTab('pending')} className={`flex-1 py-2.5 text-center rounded-lg font-semibold text-xs cursor-pointer transition-all border-none font-[family-name:var(--font-inter)] ${activeTab === 'pending' ? 'bg-[var(--primary)] text-black' : 'bg-transparent text-white/35 hover:text-white/70'}`}>Pending</button>
          <button onClick={() => setActiveTab('all')} className={`flex-1 py-2.5 text-center rounded-lg font-semibold text-xs cursor-pointer transition-all border-none font-[family-name:var(--font-inter)] ${activeTab === 'all' ? 'bg-[var(--primary)] text-black' : 'bg-transparent text-white/35 hover:text-white/70'}`}>All History</button>
        </div>

        <div className="grid grid-cols-5 gap-2.5 mb-5 max-sm:grid-cols-2">
          {[
            { label: 'Pending', val: statPending, color: 'text-yellow-500' },
            { label: 'Processing', val: statProcessing, color: 'text-yellow-500' },
            { label: 'Completed', val: statCompleted, color: 'text-green-500' },
            { label: 'Rejected', val: statRejected, color: 'text-red-500' },
            { label: 'Total', val: allWithdrawals.length, color: 'text-[var(--primary)]' },
          ].map((s) => (
            <div key={s.label} className="bg-white/[0.03] border border-white/[0.08] rounded-[14px] p-3.5 text-center">
              <div className="text-[10px] uppercase tracking-[0.5px] text-white/35 mb-1">{s.label}</div>
              <div className={`font-[family-name:var(--font-space-grotesk)] font-extrabold text-xl ${s.color}`}>{s.val}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          <input type="text" placeholder="Search by UID, wallet, or name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 py-2.5 px-3.5 rounded-[10px] border border-white/[0.08] bg-white/[0.03] text-white text-[13px] font-[family-name:var(--font-inter)] outline-none focus:border-[var(--primary)] placeholder:text-white/35" />
          <Button variant="secondary" size="sm" onClick={loadWithdrawals}>Refresh</Button>
        </div>

        {activeTab === 'pending' && (
          <Card padding="sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px] min-w-[800px]">
                <thead><tr>{['Date', 'User', 'Amount', 'Fee', 'Net', 'Wallet', 'Status', 'Actions'].map((h) => <th key={h} className="text-left py-3 px-3.5 font-semibold text-[10px] uppercase tracking-[0.5px] text-white/35 border-b border-white/[0.08] whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>
                  {pending.length === 0 ? <tr><td colSpan={8} className="text-center py-12 text-white/35 text-[13px]">No pending withdrawals</td></tr> : pending.map((w) => renderRow(w, true))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'all' && (
          <Card padding="sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px] min-w-[800px]">
                <thead><tr>{['Date', 'User', 'Amount', 'Fee', 'Net', 'Wallet', 'Status', 'Tx'].map((h) => <th key={h} className="text-left py-3 px-3.5 font-semibold text-[10px] uppercase tracking-[0.5px] text-white/35 border-b border-white/[0.08] whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.length === 0 ? <tr><td colSpan={8} className="text-center py-12 text-white/35 text-[13px]">No withdrawals found</td></tr> : filtered.map((w) => renderRow(w, false))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Confirm Modal */}
      <Modal isOpen={confirmModal.open} onClose={() => setConfirmModal({ open: false, type: 'approve', id: '' })} title={confirmModal.type === 'approve' ? 'Approve Withdrawal' : 'Reject Withdrawal'}>
        {(() => {
          const w = allWithdrawals.find((x) => x.id === confirmModal.id);
          if (!w) return null;
          return (
            <>
              <div className="space-y-1.5 text-[12px] mb-4">
                <div className="flex justify-between py-1.5 border-b border-white/[0.08]"><span className="text-white/35">User</span><span>{w.userName || w.uid}</span></div>
                <div className="flex justify-between py-1.5 border-b border-white/[0.08]"><span className="text-white/35">Amount</span><span>{w.amount} USDT</span></div>
                <div className="flex justify-between py-1.5 border-b border-white/[0.08]"><span className="text-white/35">Net</span><span>{w.netAmount || (w.amount - w.fee)} USDT</span></div>
                <div className="flex justify-between py-1.5 border-b border-white/[0.08]"><span className="text-white/35">Wallet</span><span className="break-all">{w.wallet}</span></div>
              </div>
              <p className="text-[13px] text-white/70 mb-5">{confirmModal.type === 'approve' ? 'USDT will be sent to the wallet above. This cannot be undone.' : "Full amount will be refunded to the user's balance."}</p>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setConfirmModal({ open: false, type: 'approve', id: '' })}>Cancel</Button>
                <Button variant={confirmModal.type === 'approve' ? 'primary' : 'danger'} className="flex-1" onClick={confirmAction}>{confirmModal.type === 'approve' ? 'Approve & Send' : 'Reject & Refund'}</Button>
              </div>
            </>
          );
        })()}
      </Modal>

      {/* Tx Modal */}
      <Modal isOpen={txModal.open} onClose={() => setTxModal({ open: false, id: '' })} title="Set Transaction Hash">
        {(() => {
          const w = allWithdrawals.find((x) => x.id === txModal.id);
          if (!w) return null;
          return (
            <>
              <div className="space-y-1.5 text-[12px] mb-4">
                <div className="flex justify-between py-1.5 border-b border-white/[0.08]"><span className="text-white/35">User</span><span>{w.userName || w.uid}</span></div>
                <div className="flex justify-between py-1.5 border-b border-white/[0.08]"><span className="text-white/35">Amount</span><span>{w.amount} USDT</span></div>
                <div className="flex justify-between py-1.5 border-b border-white/[0.08]"><span className="text-white/35">Wallet</span><span className="break-all">{w.wallet}</span></div>
              </div>
              <p className="text-[12px] text-white/35 mb-2">Enter the BSC transaction hash to mark as completed:</p>
              <input type="text" value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="0x..." className="w-full py-2.5 px-3.5 rounded-[10px] border border-white/[0.08] bg-white/[0.03] text-white text-[13px] font-[family-name:var(--font-space-grotesk)] outline-none focus:border-[var(--primary)] mb-4" />
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setTxModal({ open: false, id: '' })}>Cancel</Button>
                <Button className="flex-1 !bg-green-500 !text-black !border-none" onClick={confirmSetTx}>Mark Completed</Button>
              </div>
            </>
          );
        })()}
      </Modal>
      {ToastComponent}
    </div>
  );
}
