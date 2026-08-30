'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { detectApiUrl, formatTimeAgo } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';

interface Announcement {
  id: string;
  title: string;
  message: string;
  image: string;
  category: string;
  created_at: number;
}

const CATEGORIES = [
  { key: 'general', label: 'General', color: '#60a5fa' },
  { key: 'maintenance', label: 'Maintenance', color: '#fbbf24' },
  { key: 'warning', label: 'Warning', color: '#ef4444' },
  { key: 'feature', label: 'Feature Update', color: '#22c55e' },
  { key: 'promo', label: 'Promotion', color: '#a78bfa' },
];

export default function AdminAnnouncementsPage() {
  const { uid } = useAuth();
  const apiUrl = detectApiUrl();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [imagePreview, setImagePreview] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  function showToast(msg: string, error = false) {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadAnnouncements() {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/announcements`);
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }
    } catch {}
    setLoading(false);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5MB', true);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function createAnnouncement() {
    if (!title.trim() || !message.trim()) {
      showToast('Title and message required!', true);
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${apiUrl}/api/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          image: imagePreview,
          category,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      showToast('Announcement published!');
      setTitle('');
      setMessage('');
      setCategory('general');
      removeImage();
      loadAnnouncements();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', true);
    }
    setSending(false);
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm('Delete this announcement?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/announcements/delete/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
      });
      if (!res.ok) throw new Error('Failed');
      showToast('Deleted!');
      loadAnnouncements();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', true);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: 12, borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
    color: 'white', outline: 'none', fontFamily: "'Inter', sans-serif", fontSize: 14,
    boxSizing: 'border-box' as const,
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6, marginTop: 14,
  };

  return (
    <AdminLayout title="Announcements">
      <style>{`
        .ann-editor {
          width: 100%; min-height: 200px; padding: 14px; border-radius: 10;
          border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03);
          color: white; outline: none; font-family: 'Inter', sans-serif; font-size: 14;
          resize: vertical; line-height: 1.6; white-space: pre-wrap;
        }
        .ann-editor:focus { border-color: #a78bfa; }
        .ann-editor::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>

      <div style={{ maxWidth: 900 }}>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 800, margin: '0 0 25px' }}>
          Create Announcement
        </h2>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: 24 }}>
          <label style={labelStyle}>TITLE</label>
          <input
            style={inputStyle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement title..."
          />

          <label style={labelStyle}>CATEGORY</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                style={{
                  padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  border: `1px solid ${category === c.key ? c.color : 'rgba(255,255,255,0.1)'}`,
                  background: category === c.key ? `${c.color}20` : 'rgba(255,255,255,0.03)',
                  color: category === c.key ? c.color : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', transition: '0.2s',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          <label style={labelStyle}>MESSAGE (paragraphs separated by blank lines, line breaks preserved)</label>
          <textarea
            className="ann-editor"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={"Write your announcement here...\n\nEach blank line creates a new paragraph.\nLine breaks within paragraphs are preserved."}
          />

          {/* Image Upload */}
          <label style={labelStyle}>IMAGE (optional, max 5MB)</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '10px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: 6, transition: '0.2s',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
              </svg>
              {imagePreview ? 'Change Image' : 'Upload Image'}
            </button>
            {imagePreview && (
              <button
                onClick={removeImage}
                style={{
                  padding: '10px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.15)',
                  color: '#ef4444', cursor: 'pointer',
                }}
              >
                Remove
              </button>
            )}
          </div>
          {imagePreview && (
            <div style={{ marginTop: 12, position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
              <img src={imagePreview} alt="Preview" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
            </div>
          )}

          {/* Preview */}
          {(title.trim() || message.trim()) && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 16, marginTop: 18 }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>PREVIEW</div>
              {imagePreview && (
                <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 8, background: `${CATEGORIES.find(c => c.key === category)?.color || '#60a5fa'}20`, color: CATEGORIES.find(c => c.key === category)?.color || '#60a5fa', fontWeight: 700 }}>
                  {CATEGORIES.find(c => c.key === category)?.label || category}
                </span>
              </div>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{title || '(no title)'}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{message || '(no message)'}</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              onClick={createAnnouncement}
              disabled={sending}
              style={{
                flex: 1, padding: 14, borderRadius: 12, fontWeight: 800, fontSize: 14,
                cursor: sending ? 'not-allowed' : 'pointer', border: 'none',
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                color: '#000', fontFamily: "'Inter', sans-serif", opacity: sending ? 0.5 : 1,
              }}
            >
              {sending ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </div>
        </div>

        {/* Existing Announcements */}
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 800, margin: '30px 0 20px' }}>
          Published Announcements
        </h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.3)' }}>Loading...</div>
        ) : announcements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>No announcements yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {announcements.map(ann => {
              const cat = CATEGORIES.find(c => c.key === ann.category) || CATEGORIES[0];
              return (
                <div key={ann.id} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16, overflow: 'hidden',
                }}>
                  {ann.image && (
                    <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden' }}>
                      <img src={ann.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 8, background: `${cat.color}20`, color: cat.color, fontWeight: 700 }}>
                          {cat.label}
                        </span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                          {ann.created_at ? formatTimeAgo(ann.created_at) : ''}
                        </span>
                      </div>
                      <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{ann.title}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, maxHeight: 60, overflow: 'hidden', whiteSpace: 'pre-wrap' }}>
                        {ann.message}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteAnnouncement(ann.id)}
                      style={{
                        padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.15)',
                        color: '#ef4444', cursor: 'pointer', flexShrink: 0,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 30, right: 30,
          background: toast.error ? '#ef4444' : '#22c55e',
          color: toast.error ? 'white' : '#000',
          padding: '14px 24px', borderRadius: 12, fontWeight: 700,
          zIndex: 3000, fontSize: 13, boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
        }}>
          {toast.msg}
        </div>
      )}
    </AdminLayout>
  );
}
