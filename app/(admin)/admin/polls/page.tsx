'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl } from '@/lib/utils';
import Loading from '@/components/ui/Loading';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface PollData {
  id: string;
  question: string;
  options: string[];
  results: Record<string, number>;
}

export default function AdminPollsPage() {
  const { uid, loading: authLoading } = useAuth();
  const [polls, setPolls] = useState<PollData[]>([]);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState('');
  const [loading, setLoading] = useState(true);
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
      loadPolls();
    } catch {
      router.push('/admin/login');
    }
  }

  async function loadPolls() {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/polls`, { headers: { 'x-auth-uid': uid! } });
      if (res.ok) {
        const data = await res.json();
        setPolls(Array.isArray(data) ? data.map((p: Record<string, unknown>) => ({
          id: String(p.id || ''),
          question: String(p.question || ''),
          options: Array.isArray(p.options) ? p.options as string[] : [],
          results: (p.results as Record<string, number>) || {},
        })) : []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function createPoll() {
    const q = question.trim();
    const opts = options.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!q) { showToast('Enter a question', 'error'); return; }
    if (opts.length < 2) { showToast('Enter at least 2 options', 'error'); return; }

    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/polls/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({ question: q, options: opts }),
      });
      if (!res.ok) throw new Error('Failed');
      setQuestion('');
      setOptions('');
      showToast('Poll created!');
      loadPolls();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    }
  }

  async function deletePoll(id: string) {
    if (!confirm('Delete this poll?')) return;
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/polls/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed');
      showToast('Poll deleted');
      loadPolls();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    }
  }

  if (loading) return <Loading text="Loading polls..." />;

  return (
    <div className="min-h-screen bg-[#03040a] text-white p-5 md:p-7 max-w-[1000px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <a href="/admin" className="text-white/35 no-underline text-xs font-semibold hover:text-white/60 transition-colors">← Admin</a>
      </div>

      <h1 className="font-[family-name:var(--font-space-grotesk)] text-[28px] font-extrabold mb-6">Polls</h1>

      <Card className="mb-5">
        <div className="flex justify-between items-center mb-4">
          <div className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold">Create Poll</div>
        </div>
        <div className="mb-3.5">
          <label className="block text-xs font-semibold text-white/60 mb-1.5">Question</label>
          <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. What feature should we build next?" className="w-full py-3 px-3.5 rounded-[10px] border border-white/[0.1] bg-white/[0.03] text-white text-sm outline-none focus:border-[var(--primary)]" />
        </div>
        <div className="mb-4">
          <label className="block text-xs font-semibold text-white/60 mb-1.5">Options (one per line)</label>
          <textarea value={options} onChange={(e) => setOptions(e.target.value)} placeholder={"Option A\nOption B\nOption C"} className="w-full min-h-[60px] py-3 px-3.5 rounded-[10px] border border-white/[0.1] bg-white/[0.03] text-white text-sm outline-none focus:border-[var(--primary)] resize-vertical" />
        </div>
        <Button onClick={createPoll}>Create Poll</Button>
      </Card>

      <Card>
        <div className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold mb-4">All Polls</div>
        {polls.length === 0 ? (
          <div className="text-center py-10 text-white/30 text-sm">No polls yet. Create one above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead><tr>{['Question', 'Options', 'Results', 'Action'].map((h) => <th key={h} className="text-left py-3 px-2.5 text-white/50 border-b border-white/[0.1] text-[11px] uppercase tracking-wider">{h}</th>)}</tr></thead>
              <tbody>
                {polls.map((p) => {
                  const total = Object.values(p.results || {}).reduce((a, b) => a + b, 0);
                  return (
                    <tr key={p.id} className="border-b border-white/[0.03]">
                      <td className="py-3 px-2.5 font-bold">{p.question || 'Untitled'}</td>
                      <td className="py-3 px-2.5">
                        <div className="flex flex-wrap gap-1">
                          {p.options.map((o) => <span key={o} className="text-[11px] bg-white/5 px-2 py-0.5 rounded-md text-white/70">{o}</span>)}
                        </div>
                      </td>
                      <td className="py-3 px-2.5 min-w-[220px]">
                        {p.options.map((o) => {
                          const c = (p.results || {})[o] || 0;
                          const pct = total > 0 ? Math.round((c / total) * 100) : 0;
                          return (
                            <div key={o} className="flex items-center gap-2 mb-1">
                              <span className="text-[11px] text-white/60 min-w-[80px]">{o}</span>
                              <div className="h-1.5 rounded bg-[var(--primary)]" style={{ width: `${pct}%`, maxWidth: 150 }} />
                              <span className="text-[11px] font-bold text-[var(--primary)] min-w-[35px] text-right">{pct}%</span>
                              <span className="text-[10px] text-white/40">({c})</span>
                            </div>
                          );
                        })}
                      </td>
                      <td className="py-3 px-2.5">
                        <button onClick={() => deletePoll(p.id)} className="px-3 py-1.5 bg-red-500/15 text-red-500 border-none rounded-lg text-[11px] font-bold cursor-pointer hover:bg-red-500/25 transition-colors">Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {ToastComponent}
    </div>
  );
}
