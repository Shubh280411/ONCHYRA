'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl } from '@/lib/utils';
import Loading from '@/components/ui/Loading';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface ContestData {
  id: string;
  name: string;
  active: boolean;
  endTime: number;
  description?: string;
  prizes?: { rank1: number; rank2: number; rank3: number };
  participantCount?: number;
}

interface ParticipantData {
  id: string;
  contestId: string;
  userId: string;
  contestReferrals: number;
  walletAddress?: string;
  joinTime?: number;
  addedByAdmin?: boolean;
  scoreType?: string;
  winnerRank?: number;
  payoutSent?: boolean;
  name?: string;
  email?: string;
}

interface WinnerData {
  id: string;
  contestId: string;
  userId: string;
  contestReferrals: number;
  walletAddress?: string;
  winnerRank?: number;
  payoutSent?: boolean;
  name?: string;
}

export default function AdminContestPage() {
  const { uid, loading: authLoading } = useAuth();
  const [activePage, setActivePage] = useState<'dashboard' | 'contests' | 'participants' | 'winners'>('dashboard');
  const [allContests, setAllContests] = useState<ContestData[]>([]);
  const [allParticipants, setAllParticipants] = useState<ParticipantData[]>([]);
  const [selectedContestId, setSelectedContestId] = useState('');
  const [winnerContestId, setWinnerContestId] = useState('');
  const [statContests, setStatContests] = useState(0);
  const [statActive, setStatActive] = useState('None');
  const [statParticipants, setStatParticipants] = useState(0);
  const [statReferrals, setStatReferrals] = useState(0);
  const [loading, setLoading] = useState(true);

  const [contestModal, setContestModal] = useState(false);
  const [editingContestId, setEditingContestId] = useState<string | null>(null);
  const [contestName, setContestName] = useState('');
  const [contestEnd, setContestEnd] = useState('');
  const [prize1, setPrize1] = useState('15');
  const [prize2, setPrize2] = useState('10');
  const [prize3, setPrize3] = useState('5');
  const [contestDesc, setContestDesc] = useState('');

  const [addParticipantModal, setAddParticipantModal] = useState(false);
  const [addContestId, setAddContestId] = useState('');
  const [addUserSearch, setAddUserSearch] = useState('');
  const [addUserResults, setAddUserResults] = useState<{ id: string; name: string; email: string }[]>([]);
  const [addSelectedUserId, setAddSelectedUserId] = useState<string | null>(null);
  const [addLevelType, setAddLevelType] = useState('all');
  const [allUsersList, setAllUsersList] = useState<{ id: string; name: string; email: string; referralCode: string }[]>([]);

  const { showToast, ToastComponent } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!uid) { router.push('/admin/login'); return; }
    checkAdmin();
  }, [uid, authLoading]);

  async function checkAdmin() {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/check`, { headers: { 'x-auth-uid': uid! } });
      if (!res.ok) { router.push('/admin/login'); return; }
      loadDashboard();
    } catch {
      router.push('/admin/login');
    }
  }

  async function loadDashboard() {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/contests`, { headers: { 'x-auth-uid': uid! } });
      if (res.ok) {
        const data = await res.json();
        const contests: ContestData[] = Array.isArray(data.contests) ? data.contests : [];
        setAllContests(contests);
        setStatContests(contests.length);
        const activeOnes = contests.filter((c) => c.active);
        setStatActive(activeOnes.length > 0 ? activeOnes[0].name : 'None');
        setStatParticipants(data.totalParticipants || 0);
        setStatReferrals(data.totalReferrals || 0);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function loadContests() {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/contests`, { headers: { 'x-auth-uid': uid! } });
      if (res.ok) {
        const data = await res.json();
        setAllContests(Array.isArray(data.contests) ? data.contests : []);
      }
    } catch { /* ignore */ }
  }

  function openCreateContest() {
    setEditingContestId(null);
    setContestName('');
    setContestEnd('');
    setPrize1('15');
    setPrize2('10');
    setPrize3('5');
    setContestDesc('');
    setContestModal(true);
  }

  function openEditContest(c: ContestData) {
    setEditingContestId(c.id);
    setContestName(c.name);
    const endDate = new Date(c.endTime);
    setContestEnd(endDate.toISOString().slice(0, 16));
    setPrize1(String(c.prizes?.rank1 || 15));
    setPrize2(String(c.prizes?.rank2 || 10));
    setPrize3(String(c.prizes?.rank3 || 5));
    setContestDesc(c.description || '');
    setContestModal(true);
  }

  async function saveContest() {
    if (!contestName.trim() || !contestEnd) { showToast('Fill all required fields', 'error'); return; }
    try {
      const apiUrl = detectApiUrl();
      const body: Record<string, unknown> = {
        name: contestName.trim(),
        endTime: new Date(contestEnd).getTime(),
        description: contestDesc,
        prizes: { rank1: Number(prize1) || 15, rank2: Number(prize2) || 10, rank3: Number(prize3) || 5 },
      };
      if (editingContestId) body.id = editingContestId;
      const res = await fetch(`${apiUrl}/api/admin/contests/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      showToast(editingContestId ? 'Contest updated!' : 'Contest created!');
      setContestModal(false);
      loadContests();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    }
  }

  async function toggleContest(id: string, active: boolean) {
    try {
      const apiUrl = detectApiUrl();
      await fetch(`${apiUrl}/api/admin/contests/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({ id, active }),
      });
      showToast(`Contest ${active ? 'activated' : 'ended'}!`);
      loadContests();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    }
  }

  async function deleteContest(id: string) {
    if (!confirm('Delete this contest?')) return;
    try {
      const apiUrl = detectApiUrl();
      await fetch(`${apiUrl}/api/admin/contests/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({ id }),
      });
      showToast('Contest deleted!');
      loadContests();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    }
  }

  async function loadParticipants() {
    if (!selectedContestId) { setAllParticipants([]); return; }
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/contests/participants?contestId=${selectedContestId}`, { headers: { 'x-auth-uid': uid! } });
      if (res.ok) {
        const data = await res.json();
        setAllParticipants(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
  }

  function searchAddUser(val: string) {
    setAddUserSearch(val);
    if (val.length < 2) { setAddUserResults([]); return; }
    const q = val.toLowerCase();
    const matched = allUsersList.filter((u) =>
      (u.name && u.name.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q)) || u.id.includes(q)
    );
    setAddUserResults(matched.slice(0, 10));
  }

  async function showAddParticipant() {
    setAddParticipantModal(true);
    setAddContestId(selectedContestId || allContests[0]?.id || '');
    setAddUserSearch('');
    setAddUserResults([]);
    setAddSelectedUserId(null);
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/users`, { headers: { 'x-auth-uid': uid! } });
      if (res.ok) {
        const data = await res.json();
        setAllUsersList(Array.isArray(data) ? data.map((u: Record<string, unknown>) => ({
          id: String(u.id || u.uid || ''),
          name: String(u.name || ''),
          email: String(u.email || ''),
          referralCode: String(u.referralCode || ''),
        })) : []);
      }
    } catch { /* ignore */ }
  }

  async function confirmAddParticipant() {
    if (!addContestId || !addSelectedUserId) { showToast('Select contest and user', 'error'); return; }
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/contests/add-participant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({ contestId: addContestId, userId: addSelectedUserId, levelType: addLevelType }),
      });
      if (!res.ok) throw new Error('Failed');
      showToast('Participant added!');
      setAddParticipantModal(false);
      if (selectedContestId === addContestId) loadParticipants();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    }
  }

  async function removeParticipant(id: string) {
    if (!confirm('Remove this participant?')) return;
    try {
      const apiUrl = detectApiUrl();
      await fetch(`${apiUrl}/api/admin/contests/remove-participant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({ id }),
      });
      showToast('Participant removed!');
      loadParticipants();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    }
  }

  async function loadWinners() {
    if (!winnerContestId) { setAllParticipants([]); return; }
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/contests/participants?contestId=${winnerContestId}`, { headers: { 'x-auth-uid': uid! } });
      if (res.ok) {
        const data = await res.json();
        setAllParticipants(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
  }

  async function declareWinners() {
    if (!winnerContestId) { showToast('Select a contest first', 'error'); return; }
    if (!confirm('Declare top 3 as winners?')) return;
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/contests/declare-winners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({ contestId: winnerContestId }),
      });
      if (!res.ok) throw new Error('Failed');
      showToast('Winners declared!');
      loadWinners();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    }
  }

  if (loading) return <Loading text="Loading contests..." />;

  const contestSelects = allContests;
  const sortedParticipants = [...allParticipants].sort((a, b) => (b.contestReferrals || 0) - (a.contestReferrals || 0));
  const winners = sortedParticipants.filter((p) => (p.contestReferrals || 0) >= 1).slice(0, 3);
  const currentContest = allContests.find((c) => c.id === winnerContestId);
  const prizes = currentContest?.prizes || { rank1: 15, rank2: 10, rank3: 5 };

  return (
    <div className="min-h-screen bg-[#03040a] text-white">
      {/* Nav */}
      <div className="flex gap-2 p-4 bg-[rgba(10,12,25,0.95)] border-b border-white/10 sticky top-0 z-50">
        {([
          { key: 'dashboard', label: 'Dashboard' },
          { key: 'contests', label: 'Contests' },
          { key: 'participants', label: 'Participants' },
          { key: 'winners', label: 'Winners' },
        ] as const).map((p) => (
          <button key={p.key} onClick={() => { setActivePage(p.key); if (p.key === 'contests') loadContests(); }} className={`flex-1 py-3 text-center rounded-xl text-sm font-bold cursor-pointer transition-all border-none ${activePage === p.key ? 'bg-white/5 text-white border-r-[3px] border-r-[var(--primary)]' : 'bg-transparent text-white/50 hover:text-white'}`}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="p-5 md:p-7 max-w-[1000px] mx-auto">
        {/* DASHBOARD */}
        {activePage === 'dashboard' && (
          <>
            <h1 className="font-[family-name:var(--font-space-grotesk)] text-[28px] font-extrabold mb-6">Dashboard</h1>
            <div className="grid grid-cols-4 gap-3.5 mb-7">
              {[
                { label: 'Total Contests', val: statContests, color: 'text-[var(--primary)]' },
                { label: 'Active Contest', val: statActive, color: 'text-green-500' },
                { label: 'Total Participants', val: statParticipants, color: 'text-[var(--secondary)]' },
                { label: 'Total Referrals', val: statReferrals, color: 'text-green-500' },
              ].map((s) => (
                <div key={s.label} className="bg-white/[0.04] border border-white/[0.1] rounded-2xl p-5">
                  <div className="text-xs text-white/50 uppercase tracking-wider">{s.label}</div>
                  <div className={`font-[family-name:var(--font-space-grotesk)] text-[32px] font-extrabold mt-1 ${s.color}`}>{s.val}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* CONTESTS */}
        {activePage === 'contests' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="font-[family-name:var(--font-space-grotesk)] text-[28px] font-extrabold">Contests</h1>
              <Button onClick={openCreateContest}>+ Create Contest</Button>
            </div>
            <Card padding="sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead><tr>{['Name', 'Status', 'Participants', 'End Date', 'Actions'].map((h) => <th key={h} className="text-left py-3 px-2.5 text-white/50 border-b border-white/[0.1] text-[11px] uppercase tracking-wider">{h}</th>)}</tr></thead>
                  <tbody>
                    {allContests.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-10 text-white/30">No contests found</td></tr>
                    ) : allContests.map((c) => (
                      <tr key={c.id} className="border-b border-white/[0.03]">
                        <td className="py-3 px-2.5 font-bold">{c.name}</td>
                        <td className="py-3 px-2.5"><span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${c.active ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'}`}>{c.active ? 'Active' : 'Ended'}</span></td>
                        <td className="py-3 px-2.5">{c.participantCount ?? '-'}</td>
                        <td className="py-3 px-2.5">{c.endTime ? new Date(c.endTime).toLocaleDateString() : '-'}</td>
                        <td className="py-3 px-2.5">
                          <div className="flex gap-1">
                            {c.active ? (
                              <Button variant="danger" size="sm" onClick={() => toggleContest(c.id, false)}>End</Button>
                            ) : (
                              <Button variant="secondary" size="sm" onClick={() => toggleContest(c.id, true)}>Activate</Button>
                            )}
                            <Button variant="secondary" size="sm" onClick={() => openEditContest(c)}>Edit</Button>
                            <Button variant="danger" size="sm" onClick={() => deleteContest(c.id)}>Delete</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* PARTICIPANTS */}
        {activePage === 'participants' && (
          <>
            <h1 className="font-[family-name:var(--font-space-grotesk)] text-[28px] font-extrabold mb-6">Participants</h1>
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <select value={selectedContestId} onChange={(e) => { setSelectedContestId(e.target.value); }} className="flex-1 py-2.5 px-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm outline-none focus:border-[var(--primary)]">
                  <option value="">Select a contest...</option>
                  {contestSelects.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <Button variant="secondary" size="sm" onClick={loadParticipants}>Load</Button>
                <Button size="sm" onClick={showAddParticipant}>+ Add</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead><tr>{['Rank', 'User', 'Referrals', 'Type', 'Actions'].map((h) => <th key={h} className="text-left py-3 px-2.5 text-white/50 border-b border-white/[0.1] text-[11px] uppercase tracking-wider">{h}</th>)}</tr></thead>
                  <tbody>
                    {sortedParticipants.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-10 text-white/30">Select a contest to view participants</td></tr>
                    ) : sortedParticipants.map((p, i) => (
                      <tr key={p.id} className="border-b border-white/[0.03]">
                        <td className="py-3 px-2.5 font-extrabold text-[var(--primary)]">#{i + 1}</td>
                        <td className="py-3 px-2.5"><div className="font-bold">{p.name || p.userId?.slice(0, 8)}</div><div className="text-[11px] opacity-50">{p.userId?.slice(0, 10)}...</div></td>
                        <td className="py-3 px-2.5 font-bold text-[var(--primary)]">{p.contestReferrals}</td>
                        <td className="py-3 px-2.5"><span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${p.addedByAdmin ? 'bg-green-500/15 text-green-500' : 'bg-[var(--secondary)]/15 text-[var(--secondary)]'}`}>{(p.scoreType || 'ALL').toUpperCase()}</span></td>
                        <td className="py-3 px-2.5"><Button variant="danger" size="sm" onClick={() => removeParticipant(p.id)}>Remove</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* WINNERS */}
        {activePage === 'winners' && (
          <>
            <h1 className="font-[family-name:var(--font-space-grotesk)] text-[28px] font-extrabold mb-6">Winners</h1>
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <select value={winnerContestId} onChange={(e) => { setWinnerContestId(e.target.value); }} className="flex-1 py-2.5 px-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm outline-none focus:border-[var(--primary)]">
                  <option value="">Select a contest...</option>
                  {contestSelects.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <Button variant="secondary" size="sm" onClick={loadWinners}>Load</Button>
                <Button onClick={declareWinners}>Declare Winners</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead><tr>{['Rank', 'Winner', 'Referrals', 'Prize', 'Status'].map((h) => <th key={h} className="text-left py-3 px-2.5 text-white/50 border-b border-white/[0.1] text-[11px] uppercase tracking-wider">{h}</th>)}</tr></thead>
                  <tbody>
                    {winners.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-10 text-white/30">No winners found (minimum 1 referral required)</td></tr>
                    ) : winners.map((w, i) => {
                      const prizeMap: Record<number, number> = { 1: prizes.rank1, 2: prizes.rank2, 3: prizes.rank3 };
                      const rank = i + 1;
                      const rankColor = rank === 1 ? '#ffd700' : rank === 2 ? '#c0c0c0' : rank === 3 ? '#cd7f32' : 'var(--primary)';
                      return (
                        <tr key={w.id} className="border-b border-white/[0.03]">
                          <td className="py-3 px-2.5 font-extrabold" style={{ color: rankColor }}>#{rank}</td>
                          <td className="py-3 px-2.5 font-bold">{w.name || w.userId?.slice(0, 8)}</td>
                          <td className="py-3 px-2.5 font-bold text-[var(--primary)]">{w.contestReferrals}</td>
                          <td className="py-3 px-2.5 font-extrabold text-green-500">{prizeMap[rank] || 0} POL</td>
                          <td className="py-3 px-2.5"><span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${w.payoutSent ? 'bg-green-500/15 text-green-500' : 'bg-yellow-500/15 text-yellow-500'}`}>{w.payoutSent ? 'Paid' : 'Pending'}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Create/Edit Contest Modal */}
      <Modal isOpen={contestModal} onClose={() => setContestModal(false)} title={editingContestId ? 'Edit Contest' : 'Create New Contest'}>
        <div className="mb-3.5">
          <label className="block text-xs font-semibold text-white/60 mb-1.5">Contest Name</label>
          <input type="text" value={contestName} onChange={(e) => setContestName(e.target.value)} placeholder="e.g., Weekly War #1" className="w-full py-3 px-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm outline-none focus:border-[var(--primary)]" />
        </div>
        <div className="mb-3.5">
          <label className="block text-xs font-semibold text-white/60 mb-1.5">End Date & Time</label>
          <input type="datetime-local" value={contestEnd} onChange={(e) => setContestEnd(e.target.value)} className="w-full py-3 px-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm outline-none focus:border-[var(--primary)]" />
        </div>
        <div className="mb-3.5">
          <label className="block text-xs font-semibold text-white/60 mb-1.5">Prize Pool (POL)</label>
          <div className="grid grid-cols-3 gap-2.5">
            <input type="number" value={prize1} onChange={(e) => setPrize1(e.target.value)} placeholder="Rank 1" className="py-2.5 px-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm outline-none focus:border-[var(--primary)]" />
            <input type="number" value={prize2} onChange={(e) => setPrize2(e.target.value)} placeholder="Rank 2" className="py-2.5 px-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm outline-none focus:border-[var(--primary)]" />
            <input type="number" value={prize3} onChange={(e) => setPrize3(e.target.value)} placeholder="Rank 3" className="py-2.5 px-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm outline-none focus:border-[var(--primary)]" />
          </div>
        </div>
        <div className="mb-5">
          <label className="block text-xs font-semibold text-white/60 mb-1.5">Description (optional)</label>
          <textarea value={contestDesc} onChange={(e) => setContestDesc(e.target.value)} placeholder="Contest rules or notes..." className="w-full min-h-[80px] py-3 px-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm outline-none focus:border-[var(--primary)] resize-vertical" />
        </div>
        <div className="flex gap-2.5">
          <Button onClick={saveContest} className="flex-1">Save Contest</Button>
          <Button variant="secondary" onClick={() => setContestModal(false)} className="flex-1">Cancel</Button>
        </div>
      </Modal>

      {/* Add Participant Modal */}
      <Modal isOpen={addParticipantModal} onClose={() => setAddParticipantModal(false)} title="Add Participant">
        <div className="mb-3.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Contest</label>
          <select value={addContestId} onChange={(e) => setAddContestId(e.target.value)} className="w-full py-3 px-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm outline-none focus:border-[var(--primary)]">
            {allContests.map((c) => <option key={c.id} value={c.id}>{c.name} {c.active ? '[ACTIVE]' : '[ENDED]'}</option>)}
          </select>
        </div>
        <div className="mb-3.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Find User</label>
          <input type="text" value={addUserSearch} onChange={(e) => searchAddUser(e.target.value)} placeholder="Type name, email or UID..." className="w-full py-3 px-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm outline-none focus:border-[var(--primary)]" />
          <div className="max-h-[150px] overflow-y-auto mt-1.5">
            {addUserResults.map((u) => (
              <div key={u.id} onClick={() => { setAddSelectedUserId(u.id); setAddUserSearch(u.name); setAddUserResults([]); }} className={`p-2.5 rounded-lg cursor-pointer text-xs mb-1 border ${addSelectedUserId === u.id ? 'bg-[var(--primary)]/12 border-[var(--primary)]' : 'bg-white/[0.02] border-transparent hover:bg-[var(--primary)]/8'}`}>
                <span className="font-semibold">{u.name || 'Unknown'}</span> <span className="opacity-40 text-[10px]">{u.email || u.id.slice(0, 8)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Count Type</label>
          <select value={addLevelType} onChange={(e) => setAddLevelType(e.target.value)} className="w-full py-3 px-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm outline-none focus:border-[var(--primary)]">
            <option value="all">ALL (L1 + L2 + L3)</option>
            <option value="l1">L1 Only (Direct)</option>
            <option value="l2">L2 Only</option>
            <option value="l3">L3 Only</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button onClick={confirmAddParticipant} className="flex-1">Add to Contest</Button>
          <Button variant="secondary" onClick={() => setAddParticipantModal(false)} className="flex-1">Cancel</Button>
        </div>
      </Modal>

      {ToastComponent}
    </div>
  );
}
