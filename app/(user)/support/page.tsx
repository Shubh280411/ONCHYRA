'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { detectApiUrl, formatTimeAgo as timeAgo } from '@/lib/utils';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

interface Ticket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: number;
  updated_at: number;
  messageCount: number;
  lastMessage: string;
  lastMessageTime: number;
}

interface Message {
  id: string;
  ticket_id: string;
  sender: string;
  sender_name: string;
  message: string;
  is_admin: boolean;
  created_at: number;
}

const CATEGORIES = [
  { value: 'general', label: 'General Inquiry', icon: '💬' },
  { value: 'deposit', label: 'Deposit Issue', icon: '💰' },
  { value: 'withdrawal', label: 'Withdrawal Issue', icon: '💸' },
  { value: 'package', label: 'Package Issue', icon: '📦' },
  { value: 'referral', label: 'Referral Issue', icon: '👥' },
  { value: 'account', label: 'Account Issue', icon: '👤' },
  { value: 'bug', label: 'Bug Report', icon: '🐛' },
  { value: 'other', label: 'Other', icon: '📌' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#60a5fa' },
  { value: 'medium', label: 'Medium', color: '#fbbf24' },
  { value: 'high', label: 'High', color: '#ef4444' },
];

const STATUS_COLORS: Record<string, string> = { open: '#22c55e', answered: '#60a5fa', closed: '#6b7280' };

export default function SupportPage() {
  const { uid } = useAuth();
  const apiUrl = detectApiUrl();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [newMsg, setNewMsg] = useState('');
  const [replyMsg, setReplyMsg] = useState('');

  useEffect(() => {
    if (!uid || !apiUrl) return;
    fetch(`${apiUrl}/api/user/${uid}`).then(r => r.json()).then(data => {
      setUserName(data.name || '');
      setUserEmail(data.email || '');
    }).catch(() => {});
  }, [uid, apiUrl]);

  const loadTickets = useCallback(async () => {
    if (!uid) return;
    try {
      const res = await fetch(`${apiUrl}/api/support/tickets?uid=${uid}`);
      if (res.ok) setTickets(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [uid, apiUrl]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const loadMessages = useCallback(async (ticketId: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/support/tickets/${ticketId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch { /* silent */ }
  }, [apiUrl]);

  useEffect(() => {
    if (selectedTicket) loadMessages(selectedTicket);
  }, [selectedTicket, loadMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreate = async () => {
    if (!uid || !subject.trim() || !newMsg.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${apiUrl}/api/support/tickets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          userName: userName,
          userEmail: userEmail,
          subject: subject.trim(),
          category,
          priority,
          message: newMsg.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowNew(false);
        setSubject('');
        setNewMsg('');
        setCategory('general');
        setPriority('medium');
        await loadTickets();
        setSelectedTicket(data.ticketId);
      }
    } catch { /* silent */ }
    setSending(false);
  };

  const handleReply = async () => {
    if (!uid || !selectedTicket || !replyMsg.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${apiUrl}/api/support/tickets/${selectedTicket}/reply`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: uid,
          senderName: userName || 'User',
          message: replyMsg.trim(),
          isAdmin: false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyMsg('');
        await loadMessages(selectedTicket);
        await loadTickets();
      }
    } catch { /* silent */ }
    setSending(false);
  };

  const handleClose = async (ticketId: string) => {
    try {
      await fetch(`${apiUrl}/api/support/tickets/${ticketId}/close`, { method: 'POST' });
      await loadTickets();
      if (selectedTicket === ticketId) setSelectedTicket(null);
    } catch { /* silent */ }
  };

  const formatTime = (ts: number) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const currentTicket = tickets.find(t => t.id === selectedTicket);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80 }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.05)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 12 }}>Loading support...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: INTER }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 22, background: 'linear-gradient(135deg,#8b5cf6,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Support Center</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Get help from our team</div>
          </div>
          <button onClick={() => { setShowNew(!showNew); setSelectedTicket(null); }} style={{
            padding: '10px 18px', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg,#8b5cf6,#60a5fa)',
            color: '#fff', fontFamily: SG, fontWeight: 800, fontSize: 12,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 15px rgba(139,92,246,0.3)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Ticket
          </button>
        </div>

        {/* New Ticket Form */}
        {showNew && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 20, animation: 'fadeUp 0.3s ease' }}>
            <div style={{ fontFamily: SG, fontWeight: 800, fontSize: 14, marginBottom: 16 }}>Create New Ticket</div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Subject</div>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief description of your issue"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 13, fontFamily: INTER, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }} />
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Category</div>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 12, fontFamily: INTER, outline: 'none', appearance: 'none', boxSizing: 'border-box' }}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value} style={{ background: '#0b0b20' }}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Priority</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {PRIORITIES.map(p => (
                    <button key={p.value} onClick={() => setPriority(p.value)} style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, border: priority === p.value ? `1px solid ${p.color}` : '1px solid rgba(255,255,255,0.06)',
                      background: priority === p.value ? `${p.color}15` : 'rgba(255,255,255,0.03)',
                      color: priority === p.value ? p.color : 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: INTER,
                    }}>{p.label}</button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Message</div>
              <textarea value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Describe your issue in detail..." rows={4}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 13, fontFamily: INTER, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }} />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleCreate} disabled={sending || !subject.trim() || !newMsg.trim()} style={{
                padding: '10px 24px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg,#8b5cf6,#60a5fa)',
                color: '#fff', fontWeight: 800, fontSize: 12, cursor: sending ? 'not-allowed' : 'pointer',
                fontFamily: INTER, opacity: sending || !subject.trim() || !newMsg.trim() ? 0.5 : 1,
              }}>{sending ? 'Creating...' : 'Submit Ticket'}</button>
              <button onClick={() => setShowNew(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: INTER }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Ticket List */}
        {!showNew && !selectedTicket && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.3)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" style={{ margin: '0 auto 12px' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <div style={{ fontSize: 13, marginBottom: 4 }}>No support tickets yet</div>
                <div style={{ fontSize: 11 }}>Create a ticket and we&apos;ll help you out</div>
              </div>
            ) : tickets.map((t, i) => (
              <div key={t.id} onClick={() => setSelectedTicket(t.id)} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16, padding: '14px 16px', cursor: 'pointer', transition: '0.2s',
                animation: `fadeUp ${0.3 + i * 0.05}s ease`,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontFamily: SG, fontWeight: 800, fontSize: 13, flex: 1, marginRight: 8 }}>{t.subject}</div>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 9, fontWeight: 700, background: `${STATUS_COLORS[t.status] || '#6b7280'}15`, color: STATUS_COLORS[t.status] || '#6b7280', border: `1px solid ${STATUS_COLORS[t.status] || '#6b7280'}25`, textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0 }}>
                    {t.status}
                  </span>
                </div>
                {t.lastMessage && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6, lineHeight: 1.4 }}>{t.lastMessage}...</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{CATEGORIES.find(c => c.value === t.category)?.icon} {CATEGORIES.find(c => c.value === t.category)?.label}</span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{t.messageCount} messages</span>
                  </div>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{timeAgo(t.updated_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chat View */}
        {selectedTicket && currentTicket && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden' }}>
            {/* Chat Header */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4, display: 'flex' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div>
                  <div style={{ fontFamily: SG, fontWeight: 800, fontSize: 13 }}>{currentTicket.subject}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>#{currentTicket.id.slice(-8)}</div>
                </div>
              </div>
              {currentTicket.status !== 'closed' && (
                <button onClick={() => handleClose(selectedTicket)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: INTER }}>Close Ticket</button>
              )}
            </div>

            {/* Messages */}
            <div style={{ padding: '16px 18px', maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.map((m) => (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.is_admin ? 'flex-start' : 'flex-end' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: m.is_admin ? '#8b5cf6' : 'rgba(255,255,255,0.3)' }}>{m.sender_name}</span>
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>{formatTime(m.created_at)}</span>
                  </div>
                  <div style={{
                    maxWidth: '80%', padding: '10px 14px', borderRadius: 14,
                    background: m.is_admin ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.06)',
                    border: m.is_admin ? '1px solid rgba(139,92,246,0.2)' : '1px solid rgba(255,255,255,0.06)',
                    fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, whiteSpace: 'pre-wrap',
                  }}>{m.message}</div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Reply Input */}
            {currentTicket.status !== 'closed' && (
              <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8 }}>
                <input value={replyMsg} onChange={e => setReplyMsg(e.target.value)} placeholder="Type your message..."
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 12, fontFamily: INTER, outline: 'none' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }} />
                <button onClick={handleReply} disabled={sending || !replyMsg.trim()} style={{
                  padding: '10px 18px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg,#8b5cf6,#60a5fa)',
                  color: '#fff', fontWeight: 800, fontSize: 11, cursor: sending || !replyMsg.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: INTER, opacity: sending || !replyMsg.trim() ? 0.5 : 1,
                }}>{sending ? '...' : 'Send'}</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
