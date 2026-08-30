'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { detectApiUrl } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';

interface MaintenanceData {
  enabled: boolean;
  message?: string;
  endAt?: number;
  startedAt?: number;
  durationHours?: number;
  autoDisabled?: boolean;
}

interface PlatformStats {
  totalUsers: number;
  usersWithPackage: number;
  pendingWithdrawals: number;
  totalDeposits: number;
  todayRegistrations: number;
  todayDeposits: number;
}

const S = {
  card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 },
  input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: "'Inter',sans-serif" },
  btn: { padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: "'Inter',sans-serif" as const, transition: 'all 0.2s' },
};

export default function AdminMaintenancePage() {
  const { uid } = useAuth();
  const [maintenance, setMaintenance] = useState<MaintenanceData>({ enabled: false });
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [message, setMessage] = useState('');
  const [duration, setDuration] = useState('2');
  const [customEnd, setCustomEnd] = useState('');
  const [cleanupRunning, setCleanupRunning] = useState(false);
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);

  const showToast = (msg: string, err = false) => { setToast({ msg, err }); setTimeout(() => setToast(null), 3000); };

  const loadData = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const apiUrl = detectApiUrl();
      const [maintRes, statsRes] = await Promise.all([
        fetch(`${apiUrl}/api/maintenance`),
        fetch(`${apiUrl}/api/admin/stats`, { headers: { 'x-auth-uid': uid } }),
      ]);
      if (maintRes.ok) {
        const data = await maintRes.json();
        setMaintenance(data);
        setMessage(data.message || '');
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setPlatformStats({
          totalUsers: data.totalUsers || 0,
          usersWithPackage: data.usersWithPackage || 0,
          pendingWithdrawals: data.pendingWithdrawals || 0,
          totalDeposits: data.totalDeposits || 0,
          todayRegistrations: data.todayRegistrations || 0,
          todayDeposits: data.todayDeposits || 0,
        });
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [uid]);

  useEffect(() => { loadData(); }, [loadData]);

  async function toggleMaintenance(newState: boolean) {
    setToggling(true);
    try {
      const apiUrl = detectApiUrl();
      const body: Record<string, unknown> = { enabled: newState, message: message || 'System is under maintenance. Please try again later.' };
      if (newState && duration !== 'custom') {
        body.durationHours = Number(duration);
        body.endAt = Date.now() + Number(duration) * 3600000;
      } else if (newState && duration === 'custom' && customEnd) {
        body.endAt = new Date(customEnd).getTime();
      }
      const res = await fetch(`${apiUrl}/api/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setMaintenance(prev => ({ ...prev, enabled: newState, message: message, endAt: body.endAt as number | undefined, startedAt: newState ? Date.now() : prev.startedAt }));
        showToast(newState ? 'Maintenance mode ON' : 'Maintenance mode OFF');
      } else {
        showToast('Toggle failed', true);
      }
    } catch { showToast('Network error', true); }
    setToggling(false);
  }

  async function saveMessage() {
    try {
      const apiUrl = detectApiUrl();
      await fetch(`${apiUrl}/api/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
        body: JSON.stringify({ enabled: maintenance.enabled, message }),
      });
      showToast('Message saved');
    } catch { showToast('Save failed', true); }
  }

  async function runCleanup() {
    if (!confirm('Run platform cleanup?')) return;
    setCleanupRunning(true);
    try {
      const apiUrl = detectApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/cleanup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-uid': uid! },
      });
      if (res.ok) showToast('Cleanup completed');
      else showToast('Cleanup failed', true);
    } catch { showToast('Network error', true); }
    setCleanupRunning(false);
  }

  const isActive = maintenance.enabled;
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const remaining = maintenance.endAt ? Math.max(0, maintenance.endAt - now) : 0;
  const remainingH = Math.floor(remaining / 3600000);
  const remainingM = Math.floor((remaining % 3600000) / 60000);
  const remainingS = Math.floor((remaining % 60000) / 1000);

  return (
    <AdminLayout title="System Maintenance">
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '14px 24px', borderRadius: 12, background: toast.err ? 'rgba(239,68,68,0.9)' : 'rgba(34,197,94,0.9)', color: '#fff', fontSize: 14, fontWeight: 600, backdropFilter: 'blur(12px)' }}>
          {toast.msg}
        </div>
      )}

      {/* Platform Quick Stats */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Users', value: platformStats?.totalUsers ?? '...', color: '#a78bfa', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z' },
          { label: 'Active Packages', value: platformStats?.usersWithPackage ?? '...', color: '#22c55e', icon: 'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z' },
          { label: 'Pending Withdrawals', value: platformStats?.pendingWithdrawals ?? '...', color: '#fbbf24', icon: 'M2 7l10 5 10-5 M2 17l10 5 10-5' },
          { label: 'Total Deposits', value: platformStats?.totalDeposits ? `${Number(platformStats.totalDeposits).toFixed(2)} ONC` : '...', color: '#60a5fa', icon: 'M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
          { label: 'Today Signups', value: platformStats?.todayRegistrations ?? '...', color: '#22c55e', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z M22 21v-2a4 4 0 0 0-3-3.87' },
        ].map((s, i) => (
          <div key={i} style={{ ...S.card, flex: '1 1 150px', minWidth: 150 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon} /></svg>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Main Toggle */}
        <div style={S.card}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: '#fff' }}>Maintenance Mode</div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <div
              onClick={() => !toggling && toggleMaintenance(!isActive)}
              style={{
                width: 80, height: 44, borderRadius: 22, cursor: toggling ? 'not-allowed' : 'pointer',
                background: isActive ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(255,255,255,0.1)',
                border: `2px solid ${isActive ? '#ef4444' : 'rgba(255,255,255,0.15)'}`,
                position: 'relative', transition: 'all 0.3s',
                boxShadow: isActive ? '0 0 30px rgba(239,68,68,0.4), 0 0 60px rgba(239,68,68,0.2)' : 'none',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 2, left: isActive ? 38 : 2,
                transition: 'left 0.3s', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }} />
            </div>
          </div>

          <div style={{ textAlign: 'center' as const, marginBottom: 20 }}>
            <div style={{
              display: 'inline-block', padding: '8px 20px', borderRadius: 20,
              background: isActive ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
              color: isActive ? '#ef4444' : '#22c55e', fontWeight: 700, fontSize: 14,
              border: `1px solid ${isActive ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'},
              ${isActive ? 'animation: pulse-red 2s infinite' : ''}`,
            }}>
              {isActive ? 'ACTIVE - SITE IS DOWN' : 'INACTIVE - SITE IS LIVE'}
            </div>
          </div>

          {isActive && remaining > 0 && (
            <div style={{ textAlign: 'center' as const, marginBottom: 16, padding: '10px 16px', background: 'rgba(251,191,36,0.1)', borderRadius: 10, border: '1px solid rgba(251,191,36,0.2)' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Auto-disable in</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#fbbf24' }}>{remainingH}h {remainingM}m {remainingS}s</div>
            </div>
          )}

          {isActive && maintenance.startedAt && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' as const }}>
              Started: {new Date(maintenance.startedAt).toLocaleString()}
            </div>
          )}
        </div>

        {/* Settings */}
        <div style={S.card}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#fff' }}>Settings</div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Maintenance Message</label>
            <textarea
              style={{ ...S.input, minHeight: 80, resize: 'vertical' as const }}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="System is under maintenance. Please try again later."
            />
            <button onClick={saveMessage} style={{ ...S.btn, background: 'rgba(96,165,250,0.15)', color: '#60a5fa', marginTop: 8, fontSize: 12, padding: '8px 16px' }}>
              Save Message
            </button>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Auto-disable Duration</label>
            <select
              style={{ ...S.input, cursor: 'pointer' }}
              value={duration}
              onChange={e => setDuration(e.target.value)}
            >
              <option value="1">1 Hour</option>
              <option value="2">2 Hours</option>
              <option value="6">6 Hours</option>
              <option value="12">12 Hours</option>
              <option value="24">24 Hours</option>
              <option value="custom">Custom</option>
            </select>
            {duration === 'custom' && (
              <input
                type="datetime-local"
                style={{ ...S.input, marginTop: 8 }}
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
              />
            )}
          </div>

          <div style={{ padding: '12px 16px', background: 'rgba(251,191,36,0.08)', borderRadius: 10, border: '1px solid rgba(251,191,36,0.15)' }}>
            <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600, marginBottom: 4 }}>Warning</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              Users will see the maintenance message and cannot access the platform. Daily claims and other automated tasks will continue running.
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{ ...S.card, marginTop: 24, borderColor: 'rgba(239,68,68,0.2)' }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#ef4444' }}>Danger Zone</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={runCleanup}
            disabled={cleanupRunning}
            style={{ ...S.btn, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', opacity: cleanupRunning ? 0.6 : 1 }}
          >
            {cleanupRunning ? 'Running...' : 'Run Cleanup'}
          </button>
          <button
            onClick={() => { if (confirm('Reset ALL user balances to 0? This cannot be undone!')) { showToast('Balance reset not implemented yet', true); } }}
            style={{ ...S.btn, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            Reset All Balances
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
