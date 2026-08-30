'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { detectApiUrl, formatTimeAgo as timeAgo } from '@/lib/utils';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

interface Ticket {
  id: string;
  uid: string;
  user_name: string;
  user_email: string;
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

const CATEGORIES: Record<string, string> = {
  general: '💬 General', deposit: '💰 Deposit', withdrawal: '💸 Withdrawal',
  package: '📦 Package', referral: '👥 Referral', account: '👤 Account', bug: '🐛 Bug', other: '📌 Other',
};

const PRIORITY_COLORS: Record<string, string> = { low: '#60a5fa', medium: '#fbbf24', high: '#ef4444' };
const STATUS_COLORS: Record<string, string> = { open: '#22c55e', answered: '#60a5fa', closed: '#6b7280' };

export default function AdminSupportPage() {
  const apiUrl = detectApiUrl();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyMsg, setReplyMsg] = useState('');
  const [filter, setFilter] = useState('all');

  const loadTickets = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/support/tickets?all=true`);
      if (res.ok) setTickets(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [apiUrl]);

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

  const handleReply = async () => {
    if (!selectedTicket || !replyMsg.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${apiUrl}/api/support/tickets/${selectedTicket}/reply`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'admin',
          senderName: 'Support Team',
          message: replyMsg.trim(),
          isAdmin: true,
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
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);
  const openCount = tickets.filter(t => t.status === 'open').length;
  const currentTicket = tickets.find(t => t.id === selectedTicket);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80 }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.05)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 12 }}>Loading tickets...</div>
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
        <div>
          <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 22, background: 'linear-gradient(135deg,#8b5cf6,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Support Tickets</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{openCount} open ticket{openCount !== 1 ? 's' : ''}</div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'all', label: 'All', count: tickets.length },
            { key: 'open', label: 'Open', count: openCount },
            { key: 'closed', label: 'Closed', count: tickets.filter(t => t.status === 'closed').length },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '6px 14px', borderRadius: 8, border: filter === f.key ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
              background: filter === f.key ? 'rgba(139,92,246,0.1)' : 'transparent',
              color: filter === f.key ? '#8b5cf6' : 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: INTER,
            }}>{f.label} ({f.count})</button>
          ))}
        </div>

        {/* Ticket List */}
        {!selectedTicket && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.3)' }}>
                <div style={{ fontSize: 13 }}>No tickets found</div>
              </div>
            ) : filtered.map((t, i) => (
              <div key={t.id} onClick={() => setSelectedTicket(t.id)} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16, padding: '14px 16px', cursor: 'pointer', transition: '0.2s',
                animation: `fadeUp ${0.2 + i * 0.03}s ease`,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ flex: 1, marginRight: 8 }}>
                    <div style={{ fontFamily: SG, fontWeight: 800, fontSize: 13, marginBottom: 2 }}>{t.subject}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{t.user_name || 'User'} &middot; {CATEGORIES[t.category] || t.category}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[t.priority] || '#6b7280', flexShrink: 0 }} />
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 9, fontWeight: 700, background: `${STATUS_COLORS[t.status] || '#6b7280'}15`, color: STATUS_COLORS[t.status] || '#6b7280', border: `1px solid ${STATUS_COLORS[t.status] || '#6b7280'}25`, textTransform: 'uppercase' }}>
                      {t.status}
                    </span>
                  </div>
                </div>
                {t.lastMessage && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>{t.lastMessage}...</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{t.messageCount} messages</span>
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
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
                    {currentTicket.user_name} &middot; {currentTicket.user_email} &middot; {CATEGORIES[currentTicket.category] || currentTicket.category}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {currentTicket.status !== 'closed' && (
                  <button onClick={() => handleClose(selectedTicket)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: INTER }}>Close</button>
                )}
              </div>
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
                <input value={replyMsg} onChange={e => setReplyMsg(e.target.value)} placeholder="Type your reply..."
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 12, fontFamily: INTER, outline: 'none' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }} />
                <button onClick={handleReply} disabled={sending || !replyMsg.trim()} style={{
                  padding: '10px 18px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg,#8b5cf6,#60a5fa)',
                  color: '#fff', fontWeight: 800, fontSize: 11, cursor: sending || !replyMsg.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: INTER, opacity: sending || !replyMsg.trim() ? 0.5 : 1,
                }}>{sending ? '...' : 'Reply'}</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
