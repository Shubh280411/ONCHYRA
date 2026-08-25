'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';

interface PollData {
  id: string;
  question: string;
  options: string[];
  results: Record<string, number>;
}

export default function AdminPollsPage() {
  const { uid } = useAuth();
  const [polls, setPolls] = useState<PollData[]>([]);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState('');
  const [loading, setLoading] = useState(true);
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

  return (
    <AdminLayout title="Poll Management">
      {ToastComponent}
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: "'Space Grotesk'", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Create Poll</div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Question</label>
            <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. What feature should we build next?" style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Options (one per line)</label>
            <textarea value={options} onChange={(e) => setOptions(e.target.value)} placeholder={"Option A\nOption B\nOption C"} style={{ width: '100%', minHeight: 60, padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <button onClick={createPoll} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #2563eb)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Create Poll</button>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 20 }}>
          <div style={{ fontFamily: "'Space Grotesk'", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>All Polls</div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading...</div>
          ) : polls.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No polls yet. Create one above.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Question', 'Options', 'Results', 'Action'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 10px', color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {polls.map((p) => {
                    const total = Object.values(p.results || {}).reduce((a, b) => a + b, 0);
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '12px 10px', fontWeight: 700 }}>{p.question || 'Untitled'}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {p.options.map((o) => <span key={o} style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 6, color: 'rgba(255,255,255,0.6)' }}>{o}</span>)}
                          </div>
                        </td>
                        <td style={{ padding: '12px 10px', minWidth: 220 }}>
                          {p.options.map((o) => {
                            const c = (p.results || {})[o] || 0;
                            const pct = total > 0 ? Math.round((c / total) * 100) : 0;
                            return (
                              <div key={o} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', minWidth: 80 }}>{o}</span>
                                <div style={{ height: 6, borderRadius: 3, background: '#a78bfa', width: `${Math.max(pct, 2)}%`, maxWidth: 120 }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', minWidth: 35, textAlign: 'right' }}>{pct}%</span>
                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>({c})</span>
                              </div>
                            );
                          })}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <button onClick={() => deletePoll(p.id)} style={{ padding: '6px 14px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
