'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export default function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <div style={{ paddingBottom: 50 }}>
      {/* Back link */}
      <Link href="/dashboard" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 12, color: 'rgba(255,255,255,0.35)', textDecoration: 'none',
        marginBottom: 20, transition: 'color 0.2s', fontFamily: INTER,
      }}
        onMouseEnter={e => { e.currentTarget.style.color = '#a78bfa'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to Dashboard
      </Link>

      {/* Title */}
      <div style={{ fontFamily: SG, fontSize: 26, fontWeight: 800, marginBottom: 6, background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        {title}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 30 }}>
        Last updated: {lastUpdated}
      </div>

      {/* Content */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 20,
        padding: '28px 24px',
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        lineHeight: 1.8,
      }}>
        {children}
      </div>
    </div>
  );
}
