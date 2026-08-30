import Link from 'next/link';

const SG = "'Space Grotesk',sans-serif";

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#05060f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter',sans-serif",
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Image */}
      <div style={{ position: 'relative', zIndex: 1, marginBottom: 20 }}>
        <img
          src="/404.webp"
          alt="404"
          style={{
            maxWidth: 400,
            width: '80vw',
            height: 'auto',
            borderRadius: 16,
            filter: 'drop-shadow(0 0 40px rgba(139,92,246,0.15))',
          }}
        />
      </div>

      {/* Text */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 420 }}>
        <div style={{
          fontFamily: SG,
          fontWeight: 900,
          fontSize: 20,
          color: 'rgba(255,255,255,0.85)',
          marginBottom: 8,
        }}>
          Page Not Found
        </div>
        <div style={{
          fontSize: 13,
          color: 'rgba(255,255,255,0.35)',
          lineHeight: 1.6,
          marginBottom: 28,
        }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '11px 26px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
            color: '#000',
            fontWeight: 700,
            fontSize: 12,
            textDecoration: 'none',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Go Home
          </Link>
          <Link href="/dashboard" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '11px 26px',
            borderRadius: 12,
            background: 'transparent',
            color: 'rgba(255,255,255,0.6)',
            fontWeight: 700,
            fontSize: 12,
            textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Dashboard
          </Link>
        </div>
      </div>

      {/* Footer line */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        fontSize: 10,
        color: 'rgba(255,255,255,0.15)',
        textAlign: 'center',
      }}>
        &copy; 2026 ONCHYRA. All rights reserved.
      </div>
    </div>
  );
}
