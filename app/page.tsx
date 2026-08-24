import Link from 'next/link';
import ParticlesBg from './components/ParticlesBg';
import ScrollReveal from './components/ScrollReveal';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const FeatureIcons = {
  referral: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  verify: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  ),
  wallet: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  leaderboard: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10"/>
      <path d="M12 20V4"/>
      <path d="M6 20v-6"/>
    </svg>
  ),
  payout: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  polygon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
      <line x1="12" y1="22" x2="12" y2="15.5"/>
      <polyline points="22 8.5 12 15.5 2 8.5"/>
    </svg>
  ),
};

export default function Home() {
  return (
    <>
      <ParticlesBg />

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(5,6,15,0.6)', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: `${SG}, Space Grotesk, sans-serif`, fontWeight: 900, fontSize: 18,
          textDecoration: 'none', color: 'white',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ONCHYRA" width={32} height={32} style={{ borderRadius: 8, objectFit: 'contain' }} />
          <span style={{ background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ONCHYRA</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, listStyle: 'none' }}>
          {[{ label: 'About', href: '#about' }, { label: 'Features', href: '#features' }, { label: 'How It Works', href: '#how' }, { label: 'Tokenomics', href: '#tokenomics' }].map((link) => (
            <a key={link.href} href={link.href} style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>{link.label}</a>
          ))}
          <Link href="/login" style={{ padding: '8px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#000', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>Launch App</Link>
        </div>
      </nav>

      <section style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 24px 80px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 100, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', fontSize: 11, color: '#a78bfa', fontWeight: 600, marginBottom: 28 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
          Decentralized Referral Protocol
        </div>
        <h1 style={{ fontFamily: `${SG}, Space Grotesk, sans-serif`, fontWeight: 900, fontSize: 'clamp(42px, 8vw, 88px)', lineHeight: 1.05, letterSpacing: '-2px' }}>
          Referrals,<br />
          <span style={{ background: 'linear-gradient(135deg, #a78bfa, #60a5fa, #818cf8, #a78bfa)', backgroundSize: '200% 200%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'gradientShift 4s ease infinite' }}>refracted into value.</span>
        </h1>
        <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'rgba(255,255,255,0.75)', maxWidth: 540, lineHeight: 1.7, marginTop: 20 }}>
          A transparent, on-chain referral protocol. Every commission is verifiable, every level is trackable, and the community earns together.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 36, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/register" style={{ padding: '12px 28px', borderRadius: 12, fontWeight: 700, fontSize: 13, fontFamily: INTER, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#000', boxShadow: '0 4px 24px rgba(167,139,250,0.25)' }}>
            Get Started
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          <a href="#about" style={{ padding: '12px 28px', borderRadius: 12, fontWeight: 700, fontSize: 13, fontFamily: INTER, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.06)' }}>
            Learn More
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          </a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 720, width: '100%', marginTop: 64 }}>
          {[
            { num: '10K+', label: 'Users' },
            { num: '3', label: 'Referral Levels' },
            { num: '100%', label: 'On-Chain', numFontSize: 20 },
          ].map((stat, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px 16px', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
              <div style={{ fontFamily: `${SG}, Space Grotesk, sans-serif`, fontWeight: 800, fontSize: stat.numFontSize ?? 28, background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stat.num}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '.5px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
          Scroll
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, #a78bfa, transparent)', animation: 'scrollLine 2s infinite' }} />
        </div>
      </section>

      <section id="about" style={{ position: 'relative', zIndex: 1, padding: '100px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', marginTop: 40 }}>
            <div style={{ position: 'relative', aspectRatio: '1', maxWidth: 440, margin: '0 auto' }}>
              <div style={{ position: 'absolute', inset: '38%', borderRadius: '50%', background: 'radial-gradient(circle, #a78bfa, transparent)', opacity: 0.4, filter: 'blur(20px)', animation: 'pulse 3s infinite' }} />
              {[5, 18, 31, 44].map((pct, i) => (
                <div key={i} style={{ position: 'absolute', inset: `${pct}%`, borderRadius: '50%', border: '1px solid rgba(167,139,250,0.1)', animation: `spin ${30 - i * 5}s linear infinite${i % 2 === 1 ? ' reverse' : ''}` }} />
              ))}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: `${SG}, Space Grotesk, sans-serif`, fontWeight: 900, fontSize: 14, color: '#a78bfa' }}>ONCHYRA</div>
            </div>
            <div>
              <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#a78bfa', marginBottom: 12 }}>About</div>
              <h2 style={{ fontFamily: `${SG}, Space Grotesk, sans-serif`, fontWeight: 800, fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.15, marginBottom: 16 }}>Understandable before trust.</h2>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.8, marginBottom: 20 }}>
                ONCHYRA is a decentralised referral protocol built on Polygon. Every referral, every commission, every level — all verifiable on-chain. No closed doors, no hidden mechanics, no promises you can&apos;t check.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
                {['On-chain commissions', '3-level deep downline', 'Real-time dashboard', 'Community governed'].map((feat) => (
                  <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.75)', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <CheckIcon />
                    {feat}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <section id="features" style={{ position: 'relative', zIndex: 1, padding: '100px 24px', maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
        <ScrollReveal>
          <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#a78bfa', marginBottom: 12 }}>Features</div>
          <h2 style={{ fontFamily: `${SG}, Space Grotesk, sans-serif`, fontWeight: 800, fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.15, marginBottom: 16 }}>Built different.</h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 1.7, maxWidth: 560, margin: '0 auto 40px' }}>
            Every layer of the protocol is designed for transparency, accountability, and long-term value.
          </p>
        </ScrollReveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 40, textAlign: 'left' }}>
          {[
            { icon: FeatureIcons.referral, title: 'Multi-Level Referrals', desc: 'Earn commissions across three referral levels — L1 (10%), L2 (5%), L3 (3%) — automatically distributed on-chain.' },
            { icon: FeatureIcons.verify, title: 'Verifiable History', desc: 'Every commission, every withdrawal, every transfer is recorded on-chain and visible in real time. No blind spots.' },
            { icon: FeatureIcons.wallet, title: 'Secure Wallets', desc: 'Integrated deposit wallet system. Manage earnings, track balance, and withdraw — all within the protocol.' },
            { icon: FeatureIcons.leaderboard, title: 'Live Leaderboard', desc: 'See where you rank. Top earners, team builders, and most active referrers — all updated in real time.' },
            { icon: FeatureIcons.payout, title: 'Instant Payouts', desc: 'Commissions are credited the moment a referral completes a qualifying action. No delay, no manual processing.' },
            { icon: FeatureIcons.polygon, title: 'Polygon Native', desc: 'Built on Polygon for fast, low-cost transactions. Full ERC-20 compatibility with ONC token integration.' },
          ].map((card) => (
            <ScrollReveal key={card.title}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '32px 24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>{card.icon}</div>
                <h3 style={{ fontFamily: `${SG}, Space Grotesk, sans-serif`, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{card.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.7 }}>{card.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section id="how" style={{ position: 'relative', zIndex: 1, padding: '100px 24px', maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
        <ScrollReveal>
          <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#a78bfa', marginBottom: 12 }}>How It Works</div>
          <h2 style={{ fontFamily: `${SG}, Space Grotesk, sans-serif`, fontWeight: 800, fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.15, marginBottom: 16 }}>Three steps to start earning.</h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 1.7, maxWidth: 560, margin: '0 auto 40px' }}>
            Join the protocol, share your referral link, and earn commissions as your network grows.
          </p>
        </ScrollReveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 40, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 40, left: '15%', right: '15%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />
          {[
            { num: '1', title: 'Create Account', desc: 'Sign up with your email and connect your wallet. Your on-chain identity is established instantly.' },
            { num: '2', title: 'Share Your Link', desc: 'Get your unique referral link and share it. Your downline is tracked automatically — no manual work.' },
            { num: '3', title: 'Earn Commissions', desc: 'Earn from three levels of referrals. L1, L2, L3 — all paid out on-chain, instantly, transparently.' },
          ].map((step) => (
            <ScrollReveal key={step.num}>
              <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#000', fontFamily: `${SG}, Space Grotesk, sans-serif`, fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', position: 'relative', zIndex: 1 }}>{step.num}</div>
                <h3 style={{ fontFamily: `${SG}, Space Grotesk, sans-serif`, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{step.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section id="tokenomics" style={{ position: 'relative', zIndex: 1, padding: '100px 24px', maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
        <ScrollReveal>
          <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#a78bfa', marginBottom: 12 }}>Tokenomics</div>
          <h2 style={{ fontFamily: `${SG}, Space Grotesk, sans-serif`, fontWeight: 800, fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.15, marginBottom: 16 }}>One token, clear job.</h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 1.7, maxWidth: 560, margin: '0 auto 40px' }}>
            ONC powers the ONCHYRA protocol — value, utility, and rewards, all in one.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 32 }}>
            {[
              { num: 'ONC', lbl: 'Core Token', color: '#a78bfa' },
              { num: 'ERC-20', lbl: 'Standard', color: undefined },
              { num: 'Polygon', lbl: 'Network', color: undefined },
              { num: 'Deflationary', lbl: 'Model', color: '#22c55e' },
            ].map((item) => (
              <div key={item.lbl} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: `${SG}, Space Grotesk, sans-serif`, fontWeight: 800, fontSize: 28, color: item.color ?? 'white' }}>{item.num}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '.5px' }}>{item.lbl}</div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      <section style={{ textAlign: 'center', padding: '100px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.2), transparent)' }} />
        <ScrollReveal>
          <h2 style={{ fontFamily: `${SG}, Space Grotesk, sans-serif`, fontWeight: 900, fontSize: 'clamp(32px, 5vw, 52px)', maxWidth: 600, margin: '0 auto 16px' }}>Ready to build<br />your network?</h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, maxWidth: 440, margin: '0 auto 32px', lineHeight: 1.7 }}>
            Join ONCHYRA and start earning on-chain referral commissions today. No hidden fees, no gatekeepers.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{ padding: '12px 28px', borderRadius: 12, fontWeight: 700, fontSize: 13, fontFamily: INTER, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', color: '#000', boxShadow: '0 4px 24px rgba(167,139,250,0.25)' }}>
              Get Started
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <Link href="/login" style={{ padding: '12px 28px', borderRadius: 12, fontWeight: 700, fontSize: 13, fontFamily: INTER, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.06)' }}>
              Sign In
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1100, margin: '0 auto', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { label: 'Telegram', href: 'https://t.me/onchyra', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> },
            { label: 'X (Twitter)', href: 'https://x.com/onchyra', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
            { label: 'YouTube', href: 'https://youtube.com/@onchyra', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg> },
          ].map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, transition: 'color .2s' }}>
              {link.icon}
              {link.label}
            </a>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
          &copy; 2026 ONCHYRA Protocol
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .3; } }
        @keyframes gradientShift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scrollLine { 0% { transform: scaleY(0); transform-origin: top; opacity: 1; } 50% { transform: scaleY(1); transform-origin: top; } 50.01% { transform: scaleY(1); transform-origin: bottom; } 100% { transform: scaleY(0); transform-origin: bottom; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .reveal { opacity: 0; transform: translateY(30px); transition: all .7s ease; }
        .reveal.visible { opacity: 1; transform: translateY(0); }
      `}</style>
    </>
  );
}
