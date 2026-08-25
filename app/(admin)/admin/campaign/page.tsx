'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { detectApiUrl } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';

interface FeedItem { email: string; name?: string; status: string; error?: string; }
interface DailyData { today: { count: number; limit: number }; history: { date: string; count: number; limit: number }[]; }

export default function AdminCampaignPage() {
  const { uid } = useAuth();
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!uid) return;
    fetchDailyStats();
    connectSSE();
  }, [uid]);

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
      if (data.type === 'init') { setStats({ sent: data.sent || 0, failed: data.failed || 0, skipped: data.skipped || 0, total: data.total || 0 }); data.logs?.forEach((item: FeedItem) => addFeedItem(item)); if (data.running) setShowFeed(true); }
      if (data.type === 'start') { setStats((s) => ({ ...s, total: data.total })); setFeed([]); setShowFeed(true); }
      if (data.type === 'sent' || data.type === 'failed') { setStats((s) => ({ ...s, sent: data.sent, failed: data.failed })); addFeedItem({ email: data.email, name: data.name, status: data.type, error: data.error }); }
      if (data.type === 'done') { setStats({ sent: data.sent || 0, failed: data.failed || 0, skipped: data.skipped || 0, total: data.total || 0 }); setSending(false); setNotif({ msg: data.failed === 0 ? `All ${data.sent} emails sent!` : `${data.sent} sent, ${data.failed} failed`, type: data.failed > 0 ? 'error' : 'success' }); }
      if (data.type === 'error') { setNotif({ msg: 'Server error: ' + data.message, type: 'error' }); setSending(false); }
    };
    es.onerror = () => {};
  }

  function addFeedItem(item: FeedItem) { setFeed((prev) => [...prev, item]); setTimeout(() => feedRef.current?.scrollTo(0, feedRef.current.scrollHeight), 50); }
  function authHeaders(): Record<string, string> { return { 'Content-Type': 'application/json', 'x-auth-uid': uid! }; }

  async function fireBulk() {
    if (!subject.trim()) { setNotif({ msg: 'Enter a subject line.', type: 'error' }); return; }
    if (!html.trim()) { setNotif({ msg: 'Paste your email HTML template.', type: 'error' }); return; }
    setSending(true); setNotif(null);
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/email/send-custom-bulk`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ userType, subject, customHtml: html, skipCooldown }) });
      const data = await res.json();
      if (!data.success) { setNotif({ msg: data.message || 'Request failed', type: 'error' }); setSending(false); }
    } catch (e: unknown) { setNotif({ msg: 'Error: ' + (e instanceof Error ? e.message : ''), type: 'error' }); setSending(false); }
  }

  async function fireManual() {
    if (!subject.trim()) { setNotif({ msg: 'Enter a subject line.', type: 'error' }); return; }
    if (!html.trim()) { setNotif({ msg: 'Paste your email HTML template.', type: 'error' }); return; }
    if (!manualEmails.trim()) { setNotif({ msg: 'Enter at least one email.', type: 'error' }); return; }
    const emails = manualEmails.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const p = l.split(','); const e = p[0].trim(); if (!e || !e.includes('@')) return null; return p[1] ? { email: e, name: p[1].trim() } : e; }).filter(Boolean);
    if (!emails.length) { setNotif({ msg: 'No valid email addresses.', type: 'error' }); return; }
    setSending(true); setNotif(null);
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/email/send-manual`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ emails, subject, customHtml: html }) });
      const data = await res.json();
      if (!data.success) { setNotif({ msg: data.message || 'Request failed', type: 'error' }); setSending(false); }
    } catch (e: unknown) { setNotif({ msg: 'Error: ' + (e instanceof Error ? e.message : ''), type: 'error' }); setSending(false); }
  }

  async function fireCsv() {
    if (!subject.trim()) { setNotif({ msg: 'Enter a subject line.', type: 'error' }); return; }
    if (!html.trim()) { setNotif({ msg: 'Paste your email HTML template.', type: 'error' }); return; }
    if (!csvFile) { setNotif({ msg: 'Upload a CSV file first.', type: 'error' }); return; }
    setSending(true); setNotif(null);
    const fd = new FormData(); fd.append('csv', csvFile); fd.append('subject', subject); fd.append('customHtml', html);
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/email/send-csv`, { method: 'POST', headers: { 'x-auth-uid': uid! }, body: fd });
      const data = await res.json();
      if (!data.success) { setNotif({ msg: data.message || 'Request failed', type: 'error' }); setSending(false); }
    } catch (e: unknown) { setNotif({ msg: 'Error: ' + (e instanceof Error ? e.message : ''), type: 'error' }); setSending(false); }
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

  const SvgMail = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
  const SvgSend = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>;
  const SvgFile = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
  const SvgEye = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
  const SvgBolt = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
  const SvgUpload = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
  const SvgWarning = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
  const FieldLabel = ({ label, badge }: { label: string; badge?: string }) => (
    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.8, color: 'rgba(255,255,255,0.45)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
      {label} {badge && <span style={{ fontSize: 8, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', padding: '2px 7px', borderRadius: 6, fontWeight: 600 }}>{badge}</span>}
    </div>
  );
  const inputStyle: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#fff', padding: '12px 14px', outline: 'none' };

  return (
    <AdminLayout title="Email Campaigns">
      <div style={{ color: '#fff', fontFamily: "'Inter', sans-serif", maxWidth: 720 }}>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          {[
            { label: 'Sent', val: stats.sent, color: '#22c55e' },
            { label: 'Skipped', val: stats.skipped, color: '#eab308' },
            { label: 'Failed', val: stats.failed, color: '#ef4444' },
            { label: 'Total', val: stats.total, color: '#fff' },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, textAlign: 'center' }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Daily Card */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '20px 24px', marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Today&apos;s Sends</h3>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 800 }}><span>{daily?.today?.count ?? 0}</span> <span style={{ color: 'rgba(255,255,255,0.3)' }}>/ {daily?.today?.limit ?? 450}</span></div>
          </div>
          <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ height: '100%', width: `${Math.min(100, ((daily?.today?.count ?? 0) / (daily?.today?.limit ?? 450)) * 100)}%`, background: 'linear-gradient(90deg, #a78bfa, #60a5fa)', borderRadius: 99, transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Last 7 Days</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(daily?.history || []).map((d) => {
              const pct = d.count / d.limit;
              const cls = pct >= 1 ? '#ef4444' : pct >= 0.5 ? '#eab308' : '#22c55e';
              return (
                <div key={d.date} style={{ flex: '1 1 70px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 8, textTransform: 'uppercase' as const, letterSpacing: 0.5, color: 'rgba(255,255,255,0.25)' }}>{d.date.slice(5)}</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, marginTop: 2, color: cls }}>{d.count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginTop: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 4 }}>
          {([
            { key: 'bulk', label: 'Bulk', icon: <SvgMail /> },
            { key: 'manual', label: 'Manual', icon: <SvgSend /> },
            { key: 'csv', label: 'CSV', icon: <SvgFile /> },
          ] as const).map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ flex: 1, padding: 10, textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: activeTab === tab.key ? '#000' : 'rgba(255,255,255,0.35)', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s', border: 'none', background: activeTab === tab.key ? 'linear-gradient(135deg, #a78bfa, #60a5fa)' : 'transparent', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Bulk Tab */}
        {activeTab === 'bulk' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '28px 24px', marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>Bulk Campaign</div>
            <div style={{ marginBottom: 18 }}>
              <FieldLabel label="Target Users" />
              <select value={userType} onChange={(e) => setUserType(e.target.value)} style={{ ...inputStyle, appearance: 'auto' as const }}>
                <option value="active">Active Users</option><option value="inactive">Inactive Users</option><option value="all">All Users</option>
              </select>
            </div>
            <div style={{ marginBottom: 18 }}>
              <FieldLabel label="Subject Line" />
              <input style={inputStyle} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Welcome to ONCHYRA..." />
            </div>
            <div style={{ marginBottom: 18 }}>
              <FieldLabel label="Email HTML Template" badge="Use {{ USERNAME }} for name" />
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <button onClick={preview} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 4 }}><SvgEye /> Preview</button>
              </div>
              <textarea style={{ ...inputStyle, minHeight: 160, resize: 'vertical' as const, lineHeight: 1.6 }} value={html} onChange={(e) => setHtml(e.target.value)} placeholder="Paste your HTML template here..." />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={skipCooldown} onChange={(e) => setSkipCooldown(e.target.checked)} style={{ width: 'auto', accentColor: '#a78bfa' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Skip 24hr cooldown</span>
            </label>
            <button onClick={fireBulk} disabled={sending} style={{ padding: '14px 20px', border: 'none', borderRadius: 12, fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: 0.5, cursor: sending ? 'not-allowed' : 'pointer', background: sending ? 'rgba(167,139,250,0.3)' : 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', opacity: sending ? 0.3 : 1 }}>
              <SvgBolt /> {sending ? 'Sending...' : 'Send to All'}
            </button>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <SvgWarning />
              <div><strong style={{ color: '#eab308' }}>24hr cooldown</strong> — Users who received an email in the last 24 hours will be skipped. <strong>Max 450 emails per campaign.</strong></div>
            </div>
          </div>
        )}

        {/* Manual Tab */}
        {activeTab === 'manual' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '28px 24px', marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>Manual Send</div>
            <div style={{ marginBottom: 18 }}><FieldLabel label="Subject Line" /><input style={inputStyle} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Welcome to ONCHYRA..." /></div>
            <div style={{ marginBottom: 18 }}><FieldLabel label="Email HTML Template" badge="Use {{ USERNAME }} for name" /><textarea style={{ ...inputStyle, minHeight: 160, resize: 'vertical' as const, lineHeight: 1.6 }} value={html} onChange={(e) => setHtml(e.target.value)} placeholder="Paste your HTML template here..." /></div>
            <div style={{ marginBottom: 18 }}><FieldLabel label="Recipient Emails" /><textarea style={{ ...inputStyle, minHeight: 100, resize: 'vertical' as const }} value={manualEmails} onChange={(e) => setManualEmails(e.target.value)} placeholder={"john@example.com\njane@example.com, Jane Doe"} /><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 6, lineHeight: 1.5 }}>One per line. Optionally: <code style={{ background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: 4, color: 'rgba(255,255,255,0.5)' }}>email, Name</code></div></div>
            <button onClick={fireManual} disabled={sending} style={{ padding: '14px 20px', border: 'none', borderRadius: 12, fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', background: sending ? 'rgba(167,139,250,0.3)' : 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', opacity: sending ? 0.3 : 1 }}>
              <SvgBolt /> {sending ? 'Sending...' : 'Send Manually'}
            </button>
          </div>
        )}

        {/* CSV Tab */}
        {activeTab === 'csv' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '28px 24px', marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>CSV Upload</div>
            <div style={{ marginBottom: 18 }}><FieldLabel label="Subject Line" /><input style={inputStyle} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Welcome to ONCHYRA..." /></div>
            <div style={{ marginBottom: 18 }}><FieldLabel label="Email HTML Template" badge="Use {{ USERNAME }} for name" /><textarea style={{ ...inputStyle, minHeight: 160, resize: 'vertical' as const, lineHeight: 1.6 }} value={html} onChange={(e) => setHtml(e.target.value)} placeholder="Paste your HTML template here..." /></div>
            <div style={{ marginBottom: 18 }}>
              <FieldLabel label="CSV File" />
              <div onClick={() => fileInputRef.current?.click()} style={{ border: csvFile ? '1px dashed rgba(34,197,94,0.3)' : '1px dashed rgba(255,255,255,0.1)', borderRadius: 12, padding: '30px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ marginBottom: 8 }}><SvgUpload /></div>
                {csvFile ? (
                  <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 600, marginTop: 8 }}>{csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)</div>
                ) : (
                  <><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>Click or drop a CSV file here</div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>Format: email or email, Name (one per line)</div></>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) setCsvFile(f); }} />
            </div>
            <button onClick={fireCsv} disabled={sending} style={{ padding: '14px 20px', border: 'none', borderRadius: 12, fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', background: sending ? 'rgba(167,139,250,0.3)' : 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', opacity: sending ? 0.3 : 1 }}>
              <SvgBolt /> {sending ? 'Sending...' : 'Send CSV'}
            </button>
          </div>
        )}

        {/* Notification */}
        {notif && (
          <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 12, fontSize: 12, lineHeight: 1.6, border: '1px solid', background: notif.type === 'success' ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)', borderColor: notif.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: notif.type === 'success' ? '#22c55e' : '#ef4444' }}>
            {notif.msg}
          </div>
        )}

        {/* Live Feed */}
        {showFeed && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.8, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Live Feed</h4>
              <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                <span style={{ color: '#22c55e' }}>{stats.sent}</span> sent / <span style={{ color: '#eab308' }}>{stats.skipped}</span> skipped / <span style={{ color: '#ef4444' }}>{stats.failed}</span> failed
              </div>
            </div>
            <div ref={feedRef} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, maxHeight: 220, overflowY: 'auto', padding: '8px 0' }}>
              {feed.map((item, i) => (
                <div key={i} style={{ padding: '6px 14px', fontSize: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', background: item.status === 'failed' ? 'rgba(239,68,68,0.03)' : 'transparent' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>{item.email} <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{item.name || ''}</span></span>
                  <span style={{ fontWeight: 700, fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: 0.5, color: item.status === 'sent' ? '#22c55e' : item.status === 'skipped' ? '#eab308' : '#ef4444' }}>{item.status === 'sent' ? 'SENT' : item.status === 'skipped' ? 'SKIPPED' : 'FAILED'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Preview Modal */}
      {showPreview && (
        <div style={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 999, alignItems: 'center', justifyContent: 'center', padding: 40 }} onClick={(e) => { if (e.target === e.currentTarget) setShowPreview(false); }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setShowPreview(false)} style={{ position: 'absolute', top: 12, right: 14, background: 'rgba(0,0,0,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
