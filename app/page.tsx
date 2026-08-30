'use client';

import { useState } from 'react';
import Link from 'next/link';
import ParticlesBg from './components/ParticlesBg';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <ParticlesBg />

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.3} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(167,139,250,0.15)}50%{box-shadow:0 0 40px rgba(167,139,250,0.25)} }
        @keyframes float { 0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)} }
        @keyframes gradientShift { 0%,100%{background-position:0% 50%}50%{background-position:100% 50%} }
        @keyframes scrollLine { 0%{transform:scaleY(0);transform-origin:top;opacity:1}50%{transform:scaleY(1);transform-origin:top}50.01%{transform:scaleY(1);transform-origin:bottom}100%{transform:scaleY(0);transform-origin:bottom} }
        .lp-bg{position:fixed;top:-10%;left:-10%;width:120%;height:120%;background:radial-gradient(circle at 20% 20%,#8b5cf615,transparent 40%),radial-gradient(circle at 80% 80%,#3b82f610,transparent 40%);z-index:0}
        .lp-nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);background:rgba(5,6,15,0.8);border-bottom:1px solid rgba(255,255,255,0.05)}
        .lp-nav-logo{display:flex;align-items:center;gap:8px;text-decoration:none;color:white}
        .lp-nav-logo img{width:28px;height:28px;border-radius:7px}
        .lp-nav-logo span{font-family:${SG};font-weight:900;font-size:15px;background:linear-gradient(135deg,#a78bfa,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .lp-hamburger{display:flex;background:none;border:none;color:rgba(255,255,255,0.6);cursor:pointer;padding:6px;border-radius:8px}
        .lp-desktop-links{display:none}
        .lp-mobile-menu{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(5,6,15,0.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);z-index:99;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px}
        .lp-mobile-menu a{color:rgba(255,255,255,0.7);text-decoration:none;font-size:16px;font-weight:600;padding:14px 32px;border-radius:12px;transition:all .2s;width:200px;text-align:center}
        .lp-mobile-menu a:hover{background:rgba(167,139,250,0.1);color:#a78bfa}
        .lp-mobile-cta{background:linear-gradient(135deg,#a78bfa,#60a5fa)!important;color:#000!important;font-weight:700!important}
        .lp-mobile-close{position:absolute;top:16px;right:16px;background:none;border:none;color:rgba(255,255,255,0.5);cursor:pointer;padding:8px}
        @media(min-width:769px){
          .lp-hamburger{display:none!important}
          .lp-desktop-links{display:flex;align-items:center;gap:24px}
          .lp-desktop-links a{color:rgba(255,255,255,0.6);text-decoration:none;font-size:13px;font-weight:500;transition:color .2s}
          .lp-desktop-links a:hover{color:#a78bfa}
          .lp-nav-cta{padding:8px 20px;border-radius:10px;background:linear-gradient(135deg,#a78bfa,#60a5fa);color:#000;font-weight:700;font-size:12px;text-decoration:none}
          .lp-nav{padding:14px 32px}
          .lp-nav-logo img{width:32px;height:32px}
          .lp-nav-logo span{font-size:18px}
        }
        .lp-hero{position:relative;z-index:1;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:100px 20px 60px}
        .lp-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:100px;background:rgba(167,139,250,0.08);border:1px solid rgba(167,139,250,0.12);font-size:10px;color:#a78bfa;font-weight:600;margin-bottom:24px}
        .lp-badge-dot{width:5px;height:5px;border-radius:50%;background:#22c55e;animation:pulse 2s infinite}
        .lp-hero h1{font-family:${SG};font-weight:900;font-size:clamp(32px,8vw,76px);line-height:1.05;letter-spacing:-2px;margin-bottom:16px}
        .lp-hero h1 span{background:linear-gradient(135deg,#a78bfa,#60a5fa,#818cf8,#a78bfa);background-size:200% 200%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:gradientShift 4s ease infinite}
        .lp-hero p{font-size:clamp(13px,2vw,16px);color:rgba(255,255,255,0.6);max-width:480px;line-height:1.7;margin-bottom:32px}
        .lp-hero-btns{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-bottom:48px}
        .lp-btn-primary{padding:11px 26px;border-radius:11px;font-weight:700;font-size:12px;font-family:${INTER};text-decoration:none;display:inline-flex;align-items:center;gap:7px;background:linear-gradient(135deg,#a78bfa,#60a5fa);color:#000;box-shadow:0 4px 20px rgba(167,139,250,0.25);transition:all .2s}
        .lp-btn-primary:hover{transform:translateY(-2px);box-shadow:0 6px 30px rgba(167,139,250,0.35)}
        .lp-btn-secondary{padding:11px 26px;border-radius:11px;font-weight:700;font-size:12px;font-family:${INTER};text-decoration:none;display:inline-flex;align-items:center;gap:7px;background:transparent;color:white;border:1px solid rgba(255,255,255,0.08);transition:all .2s}
        .lp-btn-secondary:hover{border-color:rgba(167,139,250,0.3);background:rgba(167,139,250,0.05)}
        .lp-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:600px;width:100%}
        .lp-stat{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:16px 12px;text-align:center;backdrop-filter:blur(10px)}
        .lp-stat-num{font-family:${SG};font-weight:800;font-size:clamp(20px,4vw,28px);background:linear-gradient(135deg,#a78bfa,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .lp-stat-lbl{font-size:10px;color:rgba(255,255,255,0.3);margin-top:3px;text-transform:uppercase;letter-spacing:.5px}
        .lp-scroll{position:absolute;bottom:28px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:6px;color:rgba(255,255,255,0.25);font-size:9px;letter-spacing:1px;text-transform:uppercase}
        .lp-scroll-line{width:1px;height:36px;background:linear-gradient(to bottom,#a78bfa,transparent);animation:scrollLine 2s infinite}
        .lp-section{position:relative;z-index:1;padding:80px 20px;max-width:1000px;margin:0 auto}
        .lp-section-badge{display:inline-block;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#a78bfa;margin-bottom:10px}
        .lp-section h2{font-family:${SG};font-weight:800;font-size:clamp(22px,4vw,38px);line-height:1.15;margin-bottom:12px}
        .lp-section-desc{color:rgba(255,255,255,0.6);font-size:13px;line-height:1.7;max-width:500px}
        .lp-about-grid{display:grid;grid-template-columns:1fr;gap:32px;align-items:center;margin-top:32px}
        .lp-about-visual{position:relative;aspect-ratio:1;max-width:280px;margin:0 auto}
        .lp-about-orb{position:absolute;inset:30%;border-radius:50%;background:radial-gradient(circle,#a78bfa,transparent);opacity:.35;filter:blur(25px);animation:pulse 3s infinite}
        .lp-about-rings{position:absolute;inset:0}
        .lp-about-ring{position:absolute;inset:0;border-radius:50%;border:1px solid rgba(167,139,250,0.1)}
        .lp-about-center{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:${SG};font-weight:900;font-size:12px;color:#a78bfa}
        .lp-features-grid{display:grid;grid-template-columns:1fr;gap:10px;margin-top:28px}
        .lp-feature-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:20px 16px;transition:border-color .3s}
        .lp-feature-card:hover{border-color:rgba(167,139,250,0.2)}
        .lp-feature-icon{width:36px;height:36px;border-radius:10px;background:rgba(167,139,250,0.1);border:1px solid rgba(167,139,250,0.08);display:flex;align-items:center;justify-content:center;margin-bottom:12px}
        .lp-feature-card h3{font-family:${SG};font-weight:700;font-size:14px;margin-bottom:5px}
        .lp-feature-card p{color:rgba(255,255,255,0.6);font-size:12px;line-height:1.7}
        .lp-how-steps{display:grid;grid-template-columns:1fr;gap:12px;margin-top:28px}
        .lp-how-step{text-align:center;padding:24px 14px}
        .lp-how-num{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#a78bfa,#60a5fa);color:#000;font-family:${SG};font-weight:800;font-size:15px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px}
        .lp-how-step h3{font-family:${SG};font-weight:700;font-size:14px;margin-bottom:5px}
        .lp-how-step p{color:rgba(255,255,255,0.6);font-size:12px;line-height:1.7}
        .lp-token-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:28px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:16px}
        .lp-token-item{text-align:center;padding:10px 6px}
        .lp-token-item .num{font-family:${SG};font-weight:800;font-size:20px;color:white}
        .lp-token-item .lbl{font-size:9px;color:rgba(255,255,255,0.3);margin-top:3px;text-transform:uppercase;letter-spacing:.5px}
        .lp-cta{text-align:center;padding:60px 20px;position:relative;z-index:1}
        .lp-cta h2{font-family:${SG};font-weight:900;font-size:clamp(26px,5vw,46px);max-width:500px;margin:0 auto 14px}
        .lp-cta p{color:rgba(255,255,255,0.6);font-size:13px;max-width:400px;margin:0 auto 28px;line-height:1.7}
        .lp-cta-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
        .lp-footer{border-top:1px solid rgba(255,255,255,0.06);padding:20px 16px;display:flex;justify-content:space-between;align-items:center;max-width:1000px;margin:0 auto;flex-wrap:wrap;gap:10px;position:relative;z-index:1}
        .lp-footer-social{display:flex;gap:14px}
        .lp-footer-social a{color:rgba(255,255,255,0.3);text-decoration:none;font-size:10px;display:flex;align-items:center;gap:4px;transition:color .2s}
        .lp-footer-social a:hover{color:#a78bfa}
        .lp-footer-copy{font-size:10px;color:rgba(255,255,255,0.3)}
        .lp-check{display:flex;align-items:center;gap:8px;font-size:11px;color:rgba(255,255,255,0.65);padding:8px 10px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.05)}
        .lp-check svg{flex-shrink:0}
        @keyframes spin { to { transform: rotate(360deg); } }
        @media(min-width:769px){
          .lp-nav{padding:14px 32px}
          .lp-nav-logo img{width:32px;height:32px}
          .lp-nav-logo span{font-size:18px}
          .lp-hero{padding:120px 24px 80px}
          .lp-hero h1{letter-spacing:-3px}
          .lp-btn-primary,.lp-btn-secondary{padding:12px 28px;font-size:13px}
          .lp-stats{gap:16px;max-width:720px}
          .lp-stat{padding:20px 16px}
          .lp-stat-lbl{font-size:11px}
          .lp-section{padding:100px 24px}
          .lp-section h2{font-size:clamp(28px,4vw,42px)}
          .lp-about-grid{grid-template-columns:1fr 1fr;gap:60px}
          .lp-about-visual{max-width:440px}
          .lp-features-grid{grid-template-columns:repeat(3,1fr);gap:14px}
          .lp-feature-card{padding:28px 22px}
          .lp-feature-card h3{font-size:16px}
          .lp-feature-card p{font-size:13px}
          .lp-how-steps{grid-template-columns:repeat(3,1fr);gap:20px}
          .lp-how-step{padding:32px 20px}
          .lp-token-grid{grid-template-columns:repeat(4,1fr);padding:28px}
          .lp-token-item .num{font-size:28px}
          .lp-cta{padding:100px 24px}
          .lp-footer{padding:28px 32px}
        }
      `}</style>

      {/* Background */}
      <div className="lp-bg" />

      {/* Nav */}
      <nav className="lp-nav">
        <Link href="/" className="lp-nav-logo">
          <img src="/logo-64.png" alt="ONCHYRA" />
          <span>ONCHYRA</span>
        </Link>
        <div className="lp-desktop-links">
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#how">How It Works</a>
          <a href="#tokenomics">Tokenomics</a>
          <Link href="/support">Support</Link>
          <Link href="/login" className="lp-nav-cta">Launch App</Link>
        </div>
        <button className="lp-hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lp-mobile-menu">
          <button className="lp-mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#how" onClick={() => setMenuOpen(false)}>How It Works</a>
          <a href="#tokenomics" onClick={() => setMenuOpen(false)}>Tokenomics</a>
          <Link href="/support" onClick={() => setMenuOpen(false)}>Support</Link>
          <Link href="/login" className="lp-mobile-cta" onClick={() => setMenuOpen(false)}>Launch App</Link>
        </div>
      )}

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-badge">
          <span className="lp-badge-dot" />
          Decentralized Referral Protocol
        </div>
        <h1>
          Referrals,<br />
          <span>refracted into value.</span>
        </h1>
        <p>A transparent, on-chain referral protocol. Every commission is verifiable, every level is trackable, and the community earns together.</p>
        <div className="lp-hero-btns">
          <Link href="/register" className="lp-btn-primary">
            Get Started
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          <a href="#about" className="lp-btn-secondary">
            Learn More
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          </a>
        </div>
        <div className="lp-stats">
          {[
            { num: '10K+', label: 'Users' },
            { num: '3', label: 'Referral Levels' },
            { num: '100%', label: 'On-Chain' },
          ].map((s, i) => (
            <div key={i} className="lp-stat">
              <div className="lp-stat-num">{s.num}</div>
              <div className="lp-stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="lp-scroll">
          Scroll
          <div className="lp-scroll-line" />
        </div>
      </section>

      {/* About */}
      <section id="about" className="lp-section">
        <div className="lp-about-grid">
          <div className="lp-about-visual">
            <div className="lp-about-orb" />
            <div className="lp-about-rings">
              {[8, 20, 32, 44].map((pct, i) => (
                <div key={i} className="lp-about-ring" style={{ inset: `${pct}%`, animation: `spin ${30 - i * 5}s linear infinite${i % 2 === 1 ? ' reverse' : ''}` }} />
              ))}
            </div>
            <div className="lp-about-center">ONCHYRA</div>
          </div>
          <div>
            <div className="lp-section-badge">About</div>
            <h2>Understandable before trust.</h2>
            <p className="lp-section-desc" style={{ marginBottom: 20 }}>
              ONCHYRA is a decentralised referral protocol built on Polygon. Every referral, every commission, every level — all verifiable on-chain. No closed doors, no hidden mechanics.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {['On-chain commissions', '3-level deep downline', 'Real-time dashboard', 'Community governed'].map((f) => (
                <div key={f} className="lp-check">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="lp-section" style={{ textAlign: 'center' }}>
        <div className="lp-section-badge">Features</div>
        <h2>Built different.</h2>
        <p className="lp-section-desc" style={{ margin: '0 auto 8px' }}>
          Every layer of the protocol is designed for transparency, accountability, and long-term value.
        </p>
        <div className="lp-features-grid">
          {[
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, title: 'Multi-Level Referrals', desc: 'Earn across 3 levels — L1 (10%), L2 (5%), L3 (3%) — all distributed on-chain.' },
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>, title: 'Verifiable History', desc: 'Every commission, withdrawal, and transfer is recorded on-chain and visible in real time.' },
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, title: 'Secure Wallets', desc: 'Integrated deposit system. Manage earnings, track balance, and withdraw — all within the protocol.' },
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>, title: 'Live Leaderboard', desc: 'See where you rank. Top earners, team builders — all updated in real time.' },
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, title: 'Instant Payouts', desc: 'Commissions credited the moment a referral qualifies. No delay, no manual processing.' },
            { icon: <img src="/ONX-logo.png" alt="ONX" style={{ width: 20, height: 20, borderRadius: 4 }} />, title: 'Polygon Native', desc: 'Built on Polygon for fast, low-cost transactions. Full ERC-20 compatibility with ONC and ONX tokens.' },
          ].map((card) => (
            <div key={card.title} className="lp-feature-card" style={{ textAlign: 'left' }}>
              <div className="lp-feature-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="lp-section" style={{ textAlign: 'center' }}>
        <div className="lp-section-badge">How It Works</div>
        <h2>Three steps to start earning.</h2>
        <p className="lp-section-desc" style={{ margin: '0 auto 8px' }}>
          Join the protocol, share your referral link, and earn commissions as your network grows.
        </p>
        <div className="lp-how-steps">
          {[
            { num: '1', title: 'Create Account', desc: 'Sign up with your email and connect your wallet. Your on-chain identity is established instantly.' },
            { num: '2', title: 'Share Your Link', desc: 'Get your unique referral link and share it. Your downline is tracked automatically.' },
            { num: '3', title: 'Earn Commissions', desc: 'Earn from 3 levels of referrals. L1, L2, L3 — all paid out on-chain, instantly.' },
          ].map((step) => (
            <div key={step.num} className="lp-how-step">
              <div className="lp-how-num">{step.num}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tokenomics */}
      <section id="tokenomics" className="lp-section" style={{ textAlign: 'center' }}>
        <div className="lp-section-badge">Tokenomics</div>
        <h2>One token, clear job.</h2>
        <p className="lp-section-desc" style={{ margin: '0 auto 8px' }}>
          ONC powers the ONCHYRA protocol — value, utility, and rewards, all in one.
        </p>
        <div className="lp-token-grid">
          {[
            { num: 'ONC', lbl: 'Core Token', color: '#a78bfa' },
            { num: 'ERC-20', lbl: 'Standard', color: undefined },
            { num: 'Polygon', lbl: 'Network', color: undefined },
            { num: 'Deflationary', lbl: 'Model', color: '#22c55e' },
          ].map((item) => (
            <div key={item.lbl} className="lp-token-item">
              <div className="num" style={{ color: item.color }}>{item.num}</div>
              <div className="lbl">{item.lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="lp-cta">
        <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.2), transparent)' }} />
        <h2>Ready to build<br />your network?</h2>
        <p>Join ONCHYRA and start earning on-chain referral commissions today. No hidden fees, no gatekeepers.</p>
        <div className="lp-cta-btns">
          <Link href="/register" className="lp-btn-primary">
            Get Started
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          <Link href="/login" className="lp-btn-secondary">
            Sign In
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-social">
          <a href="https://t.me/onchyraofficial" target="_blank" rel="noopener noreferrer">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            Telegram
          </a>
          <a href="https://x.com/onchyra" target="_blank" rel="noopener noreferrer">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            X (Twitter)
          </a>
          <a href="https://youtube.com/@onchyra" target="_blank" rel="noopener noreferrer">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            YouTube
          </a>
        </div>
        <div className="lp-footer-copy">&copy; 2026 ONCHYRA Protocol</div>
      </footer>
    </>
  );
}
