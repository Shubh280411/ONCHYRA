'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

interface Popup {
  id: string;
  title: string;
  message: string;
  color: string;
  active: boolean;
  created_at: number;
  updated_at?: number;
}

const COLORS = [
  { label: 'Purple', value: '#a78bfa' },
  { label: 'Blue', value: '#60a5fa' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Yellow', value: '#fbbf24' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Pink', value: '#f472b6' },
  { label: 'Orange', value: '#fb923c' },
];

export default function PopupsPage() {
  const router = useRouter();
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [color, setColor] = useState('#a78bfa');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPopups();
  }, []);

  const loadPopups = async () => {
    try {
      const res = await fetch('/api/admin/popups');
      const data = await res.json();
      setPopups(data.popups || []);
    } catch {} finally { setLoading(false); }
  };

  const resetForm = () => {
    setTitle(''); setMessage(''); setColor('#a78bfa'); setActive(true); setEditId(null); setShowForm(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !message.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/popups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, color, active, id: editId }),
      });
      if (res.ok) { resetForm(); loadPopups(); }
    } catch {} finally { setSaving(false); }
  };

  const handleEdit = (p: Popup) => {
    setEditId(p.id); setTitle(p.title); setMessage(p.message); setColor(p.color); setActive(p.active); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this popup?')) return;
    try {
      await fetch('/api/admin/popups', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      loadPopups();
    } catch {}
  };

  const toggleActive = async (p: Popup) => {
    try {
      await fetch('/api/admin/popups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: p.title, message: p.message, color: p.color, active: !p.active, id: p.id }),
      });
      loadPopups();
    } catch {}
  };

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <AdminLayout title="Popup Manager">
      <div style={{ padding: '0 0 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: SG, fontSize: 22, fontWeight: 800, color: 'white' }}>Popup Manager</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Create popups that appear for all users on login</div>
          </div>
          <button onClick={() => { resetForm(); setShowForm(!showForm); }} style={{
            padding: '10px 20px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: INTER,
            background: showForm ? 'rgba(239,68,68,0.12)' : 'linear-gradient(135deg, #a78bfa, #60a5fa)',
            color: showForm ? '#ef4444' : '#000',
          }}>
            {showForm ? 'Cancel' : '+ New Popup'}
          </button>
        </div>

        {showForm && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, marginBottom: 24 }}>
            <div style={{ fontFamily: SG, fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 16 }}>{editId ? 'Edit Popup' : 'New Popup'}</div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Title</div>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Popup title..."
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 13, outline: 'none', fontFamily: INTER }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Message</div>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Popup message..." rows={4}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 13, outline: 'none', fontFamily: INTER, resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Accent Color</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COLORS.map(c => (
                  <div key={c.value} onClick={() => setColor(c.value)} style={{
                    width: 32, height: 32, borderRadius: 10, background: c.value, cursor: 'pointer',
                    border: color === c.value ? '3px solid white' : '2px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.2s',
                  }} title={c.label} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div onClick={() => setActive(!active)} style={{
                width: 40, height: 22, borderRadius: 11, cursor: 'pointer', position: 'relative', transition: 'all 0.2s',
                background: active ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)',
                border: `1px solid ${active ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.15)'}`,
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', position: 'absolute', top: 2, transition: 'all 0.2s',
                  background: active ? '#22c55e' : 'rgba(255,255,255,0.3)',
                  left: active ? 20 : 2,
                }} />
              </div>
              <span style={{ fontSize: 12, color: active ? '#22c55e' : 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                {active ? 'Active (shown to users)' : 'Inactive (hidden)'}
              </span>
            </div>
            <button onClick={handleSave} disabled={saving || !title.trim() || !message.trim()} style={{
              padding: '12px 24px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: INTER,
              background: title.trim() && message.trim() ? 'linear-gradient(135deg, #a78bfa, #60a5fa)' : 'rgba(255,255,255,0.05)',
              color: title.trim() && message.trim() ? '#000' : 'rgba(255,255,255,0.3)',
              opacity: saving ? 0.5 : 1,
            }}>
              {saving ? 'Saving...' : editId ? 'Update Popup' : 'Create Popup'}
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 50 }}>
            <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.05)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Loading...</div>
          </div>
        ) : popups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
            No popups created yet. Click &quot;+ New Popup&quot; to create one.
          </div>
        ) : (
          popups.map(p => (
            <div key={p.id} style={{
              background: `${p.color}08`, border: `1px solid ${p.color}20`, borderRadius: 16, padding: '18px 20px', marginBottom: 12,
              opacity: p.active ? 1 : 0.5,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.active ? '#22c55e' : 'rgba(255,255,255,0.2)' }} />
                  <div>
                    <div style={{ fontFamily: SG, fontWeight: 700, fontSize: 14, color: p.color }}>{p.title}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{formatDate(p.created_at)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => toggleActive(p)} style={{
                    padding: '6px 12px', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: INTER,
                    background: p.active ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)',
                    color: p.active ? '#22c55e' : 'rgba(255,255,255,0.4)',
                  }}>{p.active ? 'Active' : 'Inactive'}</button>
                  <button onClick={() => handleEdit(p)} style={{
                    padding: '6px 12px', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: INTER,
                    background: 'rgba(167,139,250,0.12)', color: '#a78bfa',
                  }}>Edit</button>
                  <button onClick={() => handleDelete(p.id)} style={{
                    padding: '6px 12px', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: INTER,
                    background: 'rgba(239,68,68,0.12)', color: '#ef4444',
                  }}>Delete</button>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{p.message}</div>
            </div>
          ))
        )}

        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </AdminLayout>
  );
}
