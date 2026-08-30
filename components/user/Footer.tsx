'use client';

import Link from 'next/link';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

const FOOTER_LINKS = {
  'Privacy & Terms': [
    { label: 'Terms of Use', href: '/legal/terms' },
    { label: 'Privacy Policy', href: '/legal/privacy' },
    { label: 'Cookie Policy', href: '/legal/cookies' },
    { label: 'Data Terms', href: '/legal/data' },
    { label: 'Risk Disclosure', href: '/legal/risk' },
    { label: 'Not Investment Advice', href: '/legal/not-investment-advice' },
  ],
  'Resources': [
    { label: 'Help Center', href: '/legal/help-center' },
    { label: 'FAQ', href: '/legal/faq' },
    { label: 'How It Works', href: '/legal/how-it-works' },
    { label: 'Fee Schedule', href: '/legal/fees' },
    { label: 'Trading Prohibitions', href: '/legal/trading-prohibitions' },
    { label: 'Bug Bounty', href: '/legal/bug-bounty' },
  ],
  'Company': [
    { label: 'About', href: '/legal/about' },
    { label: 'Blog', href: '/legal/blog' },
    { label: 'Roadmap', href: '/legal/roadmap' },
    { label: 'Brand Kit', href: '/legal/brand-kit' },
    { label: 'Learn', href: '/legal/learn' },
  ],
};

export default function Footer() {
  return (
    <>
      <style>{`
        .ft{border-top:1px solid rgba(255,255,255,0.06);margin-top:32px;padding:24px 16px 16px}
        .ft-logo{display:flex;align-items:center;gap:8px;margin-bottom:8px}
        .ft-logo img{width:28px;height:28px;border-radius:6px;object-fit:cover}
        .ft-logo span{font-family:${SG};font-size:14px;font-weight:800;background:linear-gradient(135deg,#a78bfa,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .ft-desc{font-size:11px;color:rgba(255,255,255,0.25);line-height:1.5;margin-bottom:20px}
        .ft-cols{display:grid;grid-template-columns:1fr;gap:16px;margin-bottom:20px}
        .ft-col-title{font-size:10px;font-weight:800;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:8px}
        .ft-col-links{display:flex;flex-direction:column;gap:6px}
        .ft-col-links a{font-size:11px;color:rgba(255,255,255,0.3);text-decoration:none;font-family:${INTER};transition:color 0.2s}
        .ft-col-links a:hover{color:#a78bfa}
        .ft-bottom{border-top:1px solid rgba(255,255,255,0.06);padding-top:12px;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center}
        .ft-copy{font-size:10px;color:rgba(255,255,255,0.2)}
        .ft-social{display:flex;gap:14px}
        .ft-social a{color:rgba(255,255,255,0.2);transition:color 0.2s}
        .ft-social a:hover{color:#60a5fa}
        @media(min-width:600px){
          .ft{padding:32px 24px 20px;margin-top:40px}
          .ft-logo img{width:32px;height:32px;border-radius:8px}
          .ft-logo span{font-size:16px}
          .ft-desc{font-size:12px;margin-bottom:28px}
          .ft-cols{grid-template-columns:repeat(3,1fr);gap:28px;margin-bottom:28px}
          .ft-col-title{font-size:11px;margin-bottom:10px}
          .ft-col-links a{font-size:12px;gap:7px}
          .ft-bottom{flex-direction:row;justify-content:space-between;text-align:left;padding-top:16px}
          .ft-copy{font-size:11px}
          .ft-social a svg{width:16px;height:16px}
        }
      `}</style>
      <footer className="ft">
        {/* Logo + Description */}
        <div className="ft-logo">
          <img src="/omchyra-logo.png" alt="ONCHYRA" />
          <span>ONCHYRA</span>
        </div>
        <div className="ft-desc">
          The next-generation decentralized trading platform. Empowering users with transparent, secure, and community-driven financial tools.
        </div>

        {/* Link Columns */}
        <div className="ft-cols">
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <div className="ft-col-title">{section}</div>
              <div className="ft-col-links">
                {links.map(link => (
                  <Link key={link.href} href={link.href}>{link.label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="ft-bottom">
          <div className="ft-copy">&copy; {new Date().getFullYear()} ONCHYRA. All rights reserved.</div>
          <div className="ft-social">
            <a href="https://x.com/onchyra" target="_blank" rel="noopener noreferrer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://t.me/onchyraofficial" target="_blank" rel="noopener noreferrer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </a>
            <a href="https://youtube.com/@onchyra" target="_blank" rel="noopener noreferrer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
