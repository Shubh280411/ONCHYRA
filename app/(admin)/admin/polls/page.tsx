'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';

const SG = "'Space Grotesk',sans-serif";

interface PollData {
  id: string;
  question: string;
  options: string[];
  results: Record<string, number>;
  created_at: number;
}

export default function AdminPollsPage() {
  const { uid } = useAuth();
  const [polls, setPolls] = useState<PollData[]>([]);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    if (uid) loadPolls();
  }, [uid]);

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
          created_at: Number(p.created_at) || 0,
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
    setCreating(true);
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
    setCreating(false);
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

  return (
    <AdminLayout title="Poll Management">
      {ToastComponent}
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Create Poll */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.08), transparent)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: SG, fontWeight: 800, fontSize: 16, color: 'white' }}>Create New Poll</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Ask your community a question</div>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Question</label>
            <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. What feature should we build next?" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Options (one per line)</label>
            <textarea value={options} onChange={(e) => setOptions(e.target.value)} placeholder={"Option A\nOption B\nOption C"} style={{ width: '100%', minHeight: 70, padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>
          <button onClick={createPoll} disabled={creating} style={{ padding: '11px 28px', borderRadius: 12, border: 'none', background: creating ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', fontSize: 13, fontWeight: 700, cursor: creating ? 'wait' : 'pointer', opacity: creating ? 0.5 : 1 }}>
            {creating ? 'Creating...' : 'Create Poll'}
          </button>
        </div>

        {/* All Polls */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: SG, fontWeight: 800, fontSize: 16, color: 'white' }}>All Polls</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{polls.length} poll{polls.length !== 1 ? 's' : ''} created</div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading...</div>
          ) : polls.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 50, color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round" style={{ margin: '0 auto 12px' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <div>No polls yet. Create one above.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {polls.map((p) => {
                const total = Object.values(p.results || {}).reduce((a, b) => a + b, 0);
                return (
                  <div key={p.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 14, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div>
                        <div style={{ fontFamily: SG, fontWeight: 700, fontSize: 14, color: 'white', marginBottom: 4 }}>{p.question || 'Untitled'}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{total} vote{total !== 1 ? 's' : ''}</div>
                      </div>
                      <button onClick={() => deletePoll(p.id)} style={{ padding: '6px 14px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                        Delete
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {p.options.map((opt) => {
                        const c = (p.results || {})[opt] || 0;
                        const pct = total > 0 ? Math.round((c / total) * 100) : 0;
                        return (
                          <div key={opt}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{opt}</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa' }}>{pct}% <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>({c})</span></span>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.04)', height: 8, borderRadius: 20, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.max(pct, 1)}%`, background: 'linear-gradient(90deg, #a78bfa, #60a5fa)', borderRadius: 20, transition: '0.5s' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
