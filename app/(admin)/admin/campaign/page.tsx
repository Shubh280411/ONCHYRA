'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl } from '@/lib/utils';
import Loading from '@/components/ui/Loading';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface FeedItem {
  email: string;
  name?: string;
  status: string;
  error?: string;
}

interface DailyData {
  today: { count: number; limit: number };
  history: { date: string; count: number; limit: number }[];
}

export default function AdminCampaignPage() {
  const { uid, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'bulk' | 'manual' | 'csv'>('bulk');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [userType, setUserType] = useState('active');
  const [manualEmails, setManualEmails] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [skipCooldown, setSkipCooldown] = useState(false);
  const [sending, setSending] = useState(false);
  const [daily, setDaily] = useState<DailyData | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [stats, setStats] = useState({ sent: 0, skipped: 0, failed: 0, total: 0 });
  const [showFeed, setShowFeed] = useState(false);
  const [notif, setNotif] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { ToastComponent } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      fetchDailyStats();
      connectSSE();
    } catch {
      router.push('/admin/login');
    }
  }

  async function fetchDailyStats() {
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/email/daily-stats`, { headers: { 'x-auth-uid': uid! } });
      if (res.ok) setDaily(await res.json());
    } catch { /* ignore */ }
  }

  function connectSSE() {
    if (eventSourceRef.current) eventSourceRef.current.close();
    const apiUrl = detectApiUrl();
    const es = new EventSource(`${apiUrl}/api/email/campaign-stream?uid=${encodeURIComponent(uid!)}`);
    eventSourceRef.current = es;
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'init') {
        setStats({ sent: data.sent || 0, failed: data.failed || 0, skipped: data.skipped || 0, total: data.total || 0 });
        data.logs?.forEach((item: FeedItem) => addFeedItem(item));
        if (data.running) setShowFeed(true);
      }
      if (data.type === 'start') { setStats((s) => ({ ...s, total: data.total })); setFeed([]); setShowFeed(true); }
      if (data.type === 'sent' || data.type === 'failed') {
        setStats((s) => ({ ...s, sent: data.sent, failed: data.failed }));
        addFeedItem({ email: data.email, name: data.name, status: data.type, error: data.error });
      }
      if (data.type === 'done') {
        setStats({ sent: data.sent || 0, failed: data.failed || 0, skipped: data.skipped || 0, total: data.total || 0 });
        setSending(false);
        setNotif({ msg: data.failed === 0 ? `All ${data.sent} emails sent!` : `${data.sent} sent, ${data.failed} failed`, type: data.failed > 0 ? 'error' : 'success' });
      }
      if (data.type === 'error') { setNotif({ msg: 'Server error: ' + data.message, type: 'error' }); setSending(false); }
    };
    es.onerror = () => {};
  }

  function addFeedItem(item: FeedItem) {
    setFeed((prev) => [...prev, item]);
    setTimeout(() => feedRef.current?.scrollTo(0, feedRef.current.scrollHeight), 50);
  }

  function authHeaders(): Record<string, string> {
    return { 'Content-Type': 'application/json', 'x-auth-uid': uid! };
  }

  async function fireBulk() {
    if (!subject.trim()) { setNotif({ msg: 'Enter a subject line.', type: 'error' }); return; }
    if (!html.trim()) { setNotif({ msg: 'Paste your email HTML template.', type: 'error' }); return; }
    setSending(true); setNotif(null);
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/email/send-custom-bulk`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ userType, subject, customHtml: html, skipCooldown }),
      });
      const data = await res.json();
      if (!data.success) { setNotif({ msg: data.message || 'Request failed', type: 'error' }); setSending(false); }
    } catch (e: unknown) {
      setNotif({ msg: 'Error: ' + (e instanceof Error ? e.message : ''), type: 'error' });
      setSending(false);
    }
  }

  async function fireManual() {
    if (!subject.trim()) { setNotif({ msg: 'Enter a subject line.', type: 'error' }); return; }
    if (!html.trim()) { setNotif({ msg: 'Paste your email HTML template.', type: 'error' }); return; }
    if (!manualEmails.trim()) { setNotif({ msg: 'Enter at least one email.', type: 'error' }); return; }
    const emails = manualEmails.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = l.split(',');
      const e = p[0].trim();
      if (!e || !e.includes('@')) return null;
      return p[1] ? { email: e, name: p[1].trim() } : e;
    }).filter(Boolean);
    if (!emails.length) { setNotif({ msg: 'No valid email addresses.', type: 'error' }); return; }
    setSending(true); setNotif(null);
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/email/send-manual`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ emails, subject, customHtml: html }),
      });
      const data = await res.json();
      if (!data.success) { setNotif({ msg: data.message || 'Request failed', type: 'error' }); setSending(false); }
    } catch (e: unknown) {
      setNotif({ msg: 'Error: ' + (e instanceof Error ? e.message : ''), type: 'error' });
      setSending(false);
    }
  }

  async function fireCsv() {
    if (!subject.trim()) { setNotif({ msg: 'Enter a subject line.', type: 'error' }); return; }
    if (!html.trim()) { setNotif({ msg: 'Paste your email HTML template.', type: 'error' }); return; }
    if (!csvFile) { setNotif({ msg: 'Upload a CSV file first.', type: 'error' }); return; }
    setSending(true); setNotif(null);
    const fd = new FormData();
    fd.append('csv', csvFile);
    fd.append('subject', subject);
    fd.append('customHtml', html);
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/email/send-csv`, { method: 'POST', headers: { 'x-auth-uid': uid! }, body: fd });
      const data = await res.json();
      if (!data.success) { setNotif({ msg: data.message || 'Request failed', type: 'error' }); setSending(false); }
    } catch (e: unknown) {
      setNotif({ msg: 'Error: ' + (e instanceof Error ? e.message : ''), type: 'error' });
      setSending(false);
    }
  }

  async function preview() {
    if (!html.trim()) { setNotif({ msg: 'Paste some HTML first.', type: 'error' }); return; }
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/email/preview-email`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ customHtml: html }) });
      const data = await res.json();
      if (data.success) { setPreviewHtml(data.html); setShowPreview(true); }
      else setNotif({ msg: 'Preview failed: ' + data.message, type: 'error' });
    } catch (e: unknown) { setNotif({ msg: 'Error: ' + (e instanceof Error ? e.message : ''), type: 'error' }); }
  }

  if (authLoading) return <Loading text="Loading campaigns..." />;

  return (
    <div className="min-h-screen bg-[#03040a] text-white flex flex-col items-center p-5 md:p-10 max-w-[720px] mx-auto">
      <div className="w-full">
        <div className="font-[family-name:var(--font-space-grotesk)] font-black text-[22px] bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] bg-clip-text text-transparent">ONCHYRA</div>
        <div className="text-[11px] text-white/35 font-medium mb-5">Email Campaign Dashboard</div>

        <div className="flex gap-2.5 mb-4">
          {[
            { label: 'Sent', val: stats.sent, color: 'text-green-500' },
            { label: 'Skipped', val: stats.skipped, color: 'text-yellow-500' },
            { label: 'Failed', val: stats.failed, color: 'text-red-500' },
            { label: 'Total', val: stats.total, color: 'text-white' },
          ].map((s) => (
            <div key={s.label} className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-[14px] p-3.5 text-center">
              <div className={`font-[family-name:var(--font-space-grotesk)] text-[22px] font-extrabold ${s.color}`}>{s.val}</div>
              <div className="text-[9px] text-white/35 uppercase tracking-[0.5px] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-[20px] p-5 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.5px] text-white/50">Today&apos;s Sends</h3>
            <div className="font-[family-name:var(--font-space-grotesk)] text-xl font-extrabold"><span>{daily?.today?.count ?? 0}</span> <span className="text-white/30">/ {daily?.today?.limit ?? 450}</span></div>
          </div>
          <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden mb-4">
            <div className="h-full bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] rounded-full transition-all" style={{ width: `${Math.min(100, ((daily?.today?.count ?? 0) / (daily?.today?.limit ?? 450)) * 100)}%` }} />
          </div>
          <div className="text-[10px] text-white/30 mb-2">Last 7 Days</div>
          <div className="flex gap-1.5 flex-wrap">
            {(daily?.history || []).map((d) => {
              const pct = d.count / d.limit;
              const cls = pct >= 1 ? 'text-red-500' : pct >= 0.5 ? 'text-yellow-500' : 'text-green-500';
              return (
                <div key={d.date} className="flex-1 min-w-[70px] bg-white/[0.02] border border-white/[0.05] rounded-[10px] p-2 text-center">
                  <div className="text-[8px] uppercase tracking-[0.5px] text-white/25">{d.date.slice(5)}</div>
                  <div className={`font-[family-name:var(--font-space-grotesk)] text-sm font-bold mt-0.5 ${cls}`}>{d.count}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-1 mb-4 bg-white/[0.03] border border-white/[0.08] rounded-[14px] p-1">
          {(['bulk', 'manual', 'csv'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.5px] rounded-[10px] cursor-pointer transition-all border-none font-[family-name:var(--font-inter)] ${activeTab === tab ? 'bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] text-black' : 'bg-transparent text-white/35 hover:text-white/60'}`}>
              {tab === 'bulk' ? 'Bulk' : tab === 'manual' ? 'Manual' : 'CSV'}
            </button>
          ))}
        </div>

        {activeTab === 'bulk' && (
          <Card className="mb-4">
            <div className="flex items-center gap-2 text-[13px] font-bold mb-5">Bulk Campaign</div>
            <Field label="Target Users">
              <select value={userType} onChange={(e) => setUserType(e.target.value)} className="w-full py-3 px-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-[13px] outline-none focus:border-[#a78bfa]">
                <option value="active">Active Users</option><option value="inactive">Inactive Users</option><option value="all">All Users</option>
              </select>
            </Field>
            <Field label="Subject Line">
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Welcome to ONCHYRA..." className="w-full py-3 px-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-[13px] outline-none focus:border-[#a78bfa]" />
            </Field>
            <Field label="Email HTML Template">
              <div className="flex gap-1.5 mb-2">
                <Button variant="secondary" size="sm" onClick={preview}>Preview</Button>
              </div>
              <textarea value={html} onChange={(e) => setHtml(e.target.value)} placeholder="Paste your HTML template here..." className="w-full min-h-[160px] p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-[13px] outline-none focus:border-[#a78bfa] resize-y leading-relaxed" />
            </Field>
            <label className="flex items-center gap-2 mb-3.5 cursor-pointer">
              <input type="checkbox" checked={skipCooldown} onChange={(e) => setSkipCooldown(e.target.checked)} className="w-auto accent-[#a78bfa]" />
              <span className="text-[11px] text-white/45">Skip 24hr cooldown (send even if user got email in last 24h)</span>
            </label>
            <Button onClick={fireBulk} loading={sending} disabled={sending} className="w-full">Send to All</Button>
          </Card>
        )}

        {activeTab === 'manual' && (
          <Card className="mb-4">
            <div className="flex items-center gap-2 text-[13px] font-bold mb-5">Manual Send</div>
            <Field label="Subject Line">
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Welcome to ONCHYRA..." className="w-full py-3 px-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-[13px] outline-none focus:border-[#a78bfa]" />
            </Field>
            <Field label="Email HTML Template">
              <textarea value={html} onChange={(e) => setHtml(e.target.value)} placeholder="Paste your HTML template here..." className="w-full min-h-[160px] p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-[13px] outline-none focus:border-[#a78bfa] resize-y leading-relaxed" />
            </Field>
            <Field label="Recipient Emails">
              <textarea value={manualEmails} onChange={(e) => setManualEmails(e.target.value)} placeholder={"john@example.com\njane@example.com, Jane Doe"} className="w-full min-h-[100px] p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-[13px] outline-none focus:border-[#a78bfa] resize-y" />
              <div className="text-[10px] text-white/30 mt-1.5">One per line. Optionally: email, Name</div>
            </Field>
            <Button onClick={fireManual} loading={sending} disabled={sending} className="w-full">Send Manually</Button>
          </Card>
        )}

        {activeTab === 'csv' && (
          <Card className="mb-4">
            <div className="flex items-center gap-2 text-[13px] font-bold mb-5">CSV Upload</div>
            <Field label="Subject Line">
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Welcome to ONCHYRA..." className="w-full py-3 px-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-[13px] outline-none focus:border-[#a78bfa]" />
            </Field>
            <Field label="Email HTML Template">
              <textarea value={html} onChange={(e) => setHtml(e.target.value)} placeholder="Paste your HTML template here..." className="w-full min-h-[160px] p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-[13px] outline-none focus:border-[#a78bfa] resize-y leading-relaxed" />
            </Field>
            <Field label="CSV File">
              <div onClick={() => fileInputRef.current?.click()} className={`border border-dashed border-white/10 rounded-xl p-7 text-center cursor-pointer transition-all hover:border-[#a78bfa] hover:bg-[#a78bfa]/[0.02] ${csvFile ? 'border-green-500/30' : ''}`}>
                {csvFile ? (
                  <div className="text-green-500 text-[11px] font-semibold">{csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)</div>
                ) : (
                  <>
                    <div className="text-[11px] text-white/35">Click or drop a CSV file here</div>
                    <div className="text-[9px] text-white/20 mt-1">Format: email or email, Name (one per line)</div>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setCsvFile(f); }} />
            </Field>
            <Button onClick={fireCsv} loading={sending} disabled={sending} className="w-full">Send CSV</Button>
          </Card>
        )}

        {notif && (
          <div className={`mt-4 px-4 py-3.5 rounded-xl text-xs font-semibold border ${notif.type === 'success' ? 'bg-green-500/6 border-green-500/15 text-green-500' : 'bg-red-500/6 border-red-500/15 text-red-500'}`}>
            {notif.msg}
          </div>
        )}

        {showFeed && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.8px] text-white/40">Live Feed</h4>
              <div className="text-[11px] font-bold font-[family-name:var(--font-space-grotesk)]">
                <span className="text-green-500">{stats.sent}</span> sent / <span className="text-yellow-500">{stats.skipped}</span> skipped / <span className="text-red-500">{stats.failed}</span> failed
              </div>
            </div>
            <div ref={feedRef} className="bg-white/[0.03] border border-white/[0.08] rounded-xl max-h-[220px] overflow-y-auto p-2">
              {feed.map((item, i) => (
                <div key={i} className={`flex justify-between items-center py-1.5 px-3.5 text-[11px] border-b border-white/[0.02] last:border-b-0 ${item.status === 'failed' ? 'bg-red-500/[0.03]' : ''}`}>
                  <span className="text-white/70">{item.email} <span className="text-white/30 text-[10px]">{item.name || ''}</span></span>
                  <span className={`font-bold text-[9px] uppercase tracking-[0.5px] ${item.status === 'sent' ? 'text-green-500' : item.status === 'skipped' ? 'text-yellow-500' : 'text-red-500'}`}>{item.status === 'sent' ? 'SENT' : item.status === 'skipped' ? 'SKIPPED' : 'FAILED'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <a href="/admin" className="inline-flex items-center gap-1.5 text-white/35 no-underline text-[11px] font-semibold mt-6 hover:text-white/60 transition-colors">&larr; Back to Admin</a>
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-black/85 z-[999] flex items-center justify-center p-10" onClick={(e) => { if (e.target === e.currentTarget) setShowPreview(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-[600px] max-h-[80vh] overflow-y-auto relative">
            <button onClick={() => setShowPreview(false)} className="absolute top-3 right-3.5 bg-black/10 border-none rounded-lg w-8 h-8 cursor-pointer flex items-center justify-center hover:bg-black/20">&times;</button>
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>
      )}
      {ToastComponent}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.8px] text-white/45 mb-1.5">{label}</div>
      {children}
    </div>
  );
}
