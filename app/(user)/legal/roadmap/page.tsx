'use client';

import LegalLayout from '@/components/user/LegalLayout';

export default function RoadmapPage() {
  return (
    <LegalLayout title="Roadmap" lastUpdated="August 2026">
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <p style={{ marginBottom: 16 }}>
          The ONCHYRA roadmap outlines our strategic vision and key milestones across four phases of development. Each phase builds upon the previous one, progressively expanding the platform&apos;s capabilities and ecosystem.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Phase 1: Foundation</h3>
        <div style={{ marginBottom: 20, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }}></div>
            <span style={{ fontWeight: 700, color: '#22c55e', fontSize: 14 }}>Completed — Q4 2024</span>
          </div>
          <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
            <li style={{ marginBottom: 6 }}>Core platform development and deployment</li>
            <li style={{ marginBottom: 6 }}>Cloud mining infrastructure setup across three regions</li>
            <li style={{ marginBottom: 6 }}>User registration and account verification system</li>
            <li style={{ marginBottom: 6 }}>Initial plan launch (Bronze, Silver, Gold)</li>
            <li style={{ marginBottom: 6 }}>Referral program implementation (3-level structure)</li>
            <li style={{ marginBottom: 6 }}>Basic wallet functionality (deposit and withdrawal)</li>
            <li style={{ marginBottom: 6 }}>Security audit and penetration testing</li>
            <li><p>Compliance framework and AML procedures established</p></li>
          </ul>
        </div>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Phase 2: Growth</h3>
        <div style={{ marginBottom: 20, background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#60a5fa', animation: 'pulse 2s infinite' }}></div>
            <span style={{ fontWeight: 700, color: '#60a5fa', fontSize: 14 }}>In Progress — Q1-Q2 2026</span>
          </div>
          <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
            <li style={{ marginBottom: 6 }}>Platinum and Diamond plan tiers launched</li>
            <li style={{ marginBottom: 6 }}>Mobile applications for iOS and Android</li>
            <li style={{ marginBottom: 6 }}>Peer-to-peer transfer functionality with burn mechanism</li>
            <li style={{ marginBottom: 6 }}>Enhanced dashboard with real-time analytics and earnings charts</li>
            <li style={{ marginBottom: 6 }}>Multi-language support (Spanish, French, German, Portuguese, Japanese)</li>
            <li style={{ marginBottom: 6 }}>Expanded mining infrastructure in Asia-Pacific region</li>
            <li style={{ marginBottom: 6 }}>Advanced security features (hardware key support, session management)</li>
            <li><p>Community governance framework development</p></li>
          </ul>
        </div>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Phase 3: Scale</h3>
        <div style={{ marginBottom: 20, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#a78bfa' }}></div>
            <span style={{ fontWeight: 700, color: '#a78bfa', fontSize: 14 }}>Planned — Q3-Q4 2026</span>
          </div>
          <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
            <li style={{ marginBottom: 6 }}>DeFi integration — lending, borrowing, and yield farming</li>
            <li style={{ marginBottom: 6 }}>NFT marketplace for digital collectibles and platform rewards</li>
            <li style={{ marginBottom: 6 }}>Cross-chain bridge for multi-blockchain asset transfers</li>
            <li style={{ marginBottom: 6 }}>Advanced analytics dashboard with AI-powered insights</li>
            <li style={{ marginBottom: 6 }}>Institutional API for enterprise clients and partners</li>
            <li style={{ marginBottom: 6 }}>White-label solution for partner platforms</li>
            <li style={{ marginBottom: 6 }}>Governance token launch and community voting</li>
            <li><p>Strategic partnerships with major exchanges and financial institutions</p></li>
          </ul>
        </div>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Phase 4: Ecosystem</h3>
        <div style={{ marginBottom: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }}></div>
            <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Future Vision — 2027+</span>
          </div>
          <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
            <li style={{ marginBottom: 6 }}>Full decentralized governance with community-driven decision making</li>
            <li style={{ marginBottom: 6 }}>ONCHYRA Chain — our own dedicated blockchain network</li>
            <li style={{ marginBottom: 6 }}>Decentralized exchange (DEX) integrated into the platform</li>
            <li style={{ marginBottom: 6 }}>Payment gateway for merchants to accept ONCHYRA tokens</li>
            <li style={{ marginBottom: 6 }}>Educational academy with certified courses on blockchain and digital assets</li>
            <li style={{ marginBottom: 6 }}>Venture fund to support promising blockchain startups</li>
            <li><p>Global expansion targeting 50+ countries with localized services</p></li>
          </ul>
        </div>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Progress Tracking</h3>
        <p style={{ marginBottom: 12 }}>
          We are committed to transparency in our development progress. We publish regular updates through:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Monthly development reports on our blog</li>
          <li style={{ marginBottom: 6 }}>Weekly progress updates on our social media channels</li>
          <li style={{ marginBottom: 6 }}>Quarterly AMAs with the development team</li>
          <li><p>Real-time status page at status.onchyra.com</p></li>
        </ul>
        <p style={{ marginBottom: 12 }}>
          Timelines are estimates and may be adjusted based on market conditions, regulatory requirements, and technical considerations. We will communicate any changes to the roadmap promptly and transparently.
        </p>
      </div>
    </LegalLayout>
  );
}
