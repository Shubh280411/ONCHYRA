'use client';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

export default function AiMinerPage() {
  return (
    <div style={{ fontFamily: INTER, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 40 }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      <div style={{ textAlign: 'center', animation: 'fadeUp 0.6s ease' }}>
        {/* Icon */}
        <div style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(96,165,250,0.1))', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            <line x1="6" y1="12" x2="18" y2="12"/>
            <line x1="6" y1="16" x2="18" y2="16"/>
          </svg>
        </div>

        {/* Title */}
        <div style={{ fontFamily: SG, fontWeight: 900, fontSize: 24, marginBottom: 8 }}>
          <span style={{ background: 'linear-gradient(135deg,#8b5cf6,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Quantum Vault</span>
        </div>

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 100, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)', marginBottom: 20, animation: 'pulse 2s infinite' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span style={{ fontFamily: SG, fontWeight: 800, fontSize: 12, color: '#fbbf24', letterSpacing: 0.5 }}>COMING SOON</span>
        </div>

        {/* Description */}
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, maxWidth: 360, margin: '0 auto 24px' }}>
          Premium AI-powered mining plans are being crafted with exclusive rewards. Stay tuned for something extraordinary.
        </div>

        {/* Features Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320, margin: '0 auto' }}>
          {[
            { icon: '⚡', text: 'High-yield mining plans' },
            { icon: '🔒', text: 'Secure & transparent' },
            { icon: '💎', text: 'Exclusive member rewards' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', animation: `fadeUp ${0.7 + i * 0.1}s ease` }}>
              <span style={{ fontSize: 16 }}>{f.icon}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
