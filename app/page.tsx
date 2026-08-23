import Link from 'next/link';
import ParticlesBg from './components/ParticlesBg';

const fontSpaceGrotesk = 'font-[family-name:var(--font-space-grotesk)]';
const fontInter = 'font-[family-name:var(--font-inter)]';

export default function Home() {
  return (
    <>
      <ParticlesBg />

      {/* ─── Nav ─── */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(5,6,15,0.6)',
        borderBottom: '1px solid var(--border)',
      }}>
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 900,
          fontSize: 18,
          textDecoration: 'none',
          color: 'white',
        }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ borderRadius: 8 }}>
            <rect width="32" height="32" rx="8" fill="url(#logo-grad)" />
            <path d="M10 22V10h4l4 6 4-6h4v12h-3.5v-7.5L19 18l-3.5-3.5V22H10z" fill="#000" />
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#a78bfa" />
                <stop offset="1" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
          </svg>
          <span style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>ONCHYRA</span>
        </Link>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 28,
          listStyle: 'none',
        }}>
          {[
            { label: 'About', href: '#about' },
            { label: 'Features', href: '#features' },
            { label: 'How It Works', href: '#how' },
            { label: 'Tokenomics', href: '#tokenomics' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                color: 'var(--text)',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 500,
                transition: 'color .2s',
              }}
            >
              {link.label}
            </a>
          ))}
          <Link href="/login" style={{
            padding: '8px 20px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: '#000',
            fontWeight: 700,
            fontSize: 12,
            textDecoration: 'none',
          }}>
            Launch App
          </Link>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '120px 24px 80px',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 14px',
          borderRadius: 100,
          background: 'rgba(167,139,250,0.08)',
          border: '1px solid rgba(167,139,250,0.15)',
          fontSize: 11,
          color: 'var(--primary)',
          fontWeight: 600,
          letterSpacing: '.3px',
          marginBottom: 28,
        }}>
          <span style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'var(--accent)',
            animation: 'pulse 2s infinite',
          }} />
          Decentralized Referral Protocol
        </div>

        <h1 style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 900,
          fontSize: 'clamp(42px, 8vw, 88px)',
          lineHeight: 1.05,
          letterSpacing: '-2px',
        }}>
          Referrals,<br />
          <span style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary), #818cf8, var(--primary))',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'gradientShift 4s ease infinite',
          }}>refracted into value.</span>
        </h1>

        <p style={{
          fontSize: 'clamp(15px, 2vw, 18px)',
          color: 'var(--text)',
          maxWidth: 540,
          lineHeight: 1.7,
          marginTop: 20,
        }}>
          A transparent, on-chain referral protocol. Every commission is verifiable, every level is trackable, and the community earns together.
        </p>

        <div style={{
          display: 'flex',
          gap: 12,
          marginTop: 36,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <Link href="/register" style={{
            padding: '12px 28px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 13,
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
            border: 'none',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: '#000',
            boxShadow: '0 4px 24px rgba(167,139,250,0.25)',
          }}>
            Get Started
          </Link>
          <a href="#about" style={{
            padding: '12px 28px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 13,
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            color: 'white',
            border: '1px solid var(--border)',
          }}>
            Learn More
          </a>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          maxWidth: 720,
          width: '100%',
          marginTop: 64,
        }}>
          {[
            { num: '...', label: 'Users' },
            { num: '3', label: 'Referral Levels' },
            { num: '100%', label: 'On-Chain', numFontSize: 20 },
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: '20px 16px',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              transition: 'all .3s',
            }}>
              <div style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 800,
                fontSize: stat.numFontSize ?? 28,
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>{stat.num}</div>
              <div style={{
                fontSize: 11,
                color: 'var(--text-dim)',
                marginTop: 4,
                textTransform: 'uppercase',
                letterSpacing: '.5px',
              }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* scroll indicator */}
        <div style={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          color: 'var(--text-dim)',
          fontSize: 10,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}>
          Scroll
          <div style={{
            width: 1,
            height: 40,
            background: 'linear-gradient(to bottom, var(--primary), transparent)',
            animation: 'scrollLine 2s infinite',
          }} />
        </div>
      </section>

      {/* ─── About ─── */}
      <section id="about" style={{ position: 'relative', zIndex: 1, padding: '100px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 60,
          alignItems: 'center',
          marginTop: 40,
        }}>
          {/* Visual rings */}
          <div style={{
            position: 'relative',
            aspectRatio: '1',
            maxWidth: 440,
            margin: '0 auto',
          }}>
            <div style={{
              position: 'absolute',
              inset: '38%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, var(--primary), transparent)',
              opacity: 0.4,
              filter: 'blur(20px)',
              animation: 'pulse 3s infinite',
            }} />
            {[5, 18, 31, 44].map((pct, i) => (
              <div key={i} style={{
                position: 'absolute',
                inset: `${pct}%`,
                borderRadius: '50%',
                border: '1px solid rgba(167,139,250,0.1)',
                animation: `spin ${30 - i * 5}s linear infinite${i % 2 === 1 ? ' reverse' : ''}`,
              }} />
            ))}
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 900,
              fontSize: 14,
              color: 'var(--primary)',
            }}>ONCHYRA</div>
          </div>

          <div>
            <div style={{
              display: 'inline-block',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: 'var(--primary)',
              marginBottom: 12,
            }}>About</div>
            <h2 style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(28px, 4vw, 42px)',
              lineHeight: 1.15,
              marginBottom: 16,
            }}>Understandable before trust.</h2>
            <p style={{
              color: 'var(--text)',
              fontSize: 15,
              lineHeight: 1.7,
              maxWidth: 560,
            }}>
              ONCHYRA is a decentralised referral protocol built on Polygon. Every referral, every commission, every level — all verifiable on-chain. No closed doors, no hidden mechanics, no promises you can&apos;t check.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              marginTop: 20,
            }}>
              {[
                'On-chain commissions',
                '3-level deep downline',
                'Real-time dashboard',
                'Community governed',
              ].map((feat) => (
                <div key={feat} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  color: 'var(--text)',
                  padding: '10px 14px',
                  background: 'var(--card)',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                }}>
                  <span style={{ color: 'var(--primary)', fontSize: 15 }}>+</span>
                  {feat}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" style={{
        position: 'relative',
        zIndex: 1,
        padding: '100px 24px',
        maxWidth: 1100,
        margin: '0 auto',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: 'var(--primary)',
          marginBottom: 12,
        }}>Features</div>
        <h2 style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(28px, 4vw, 42px)',
          lineHeight: 1.15,
          marginBottom: 16,
        }}>Built different.</h2>
        <p style={{
          color: 'var(--text)',
          fontSize: 15,
          lineHeight: 1.7,
          maxWidth: 560,
          margin: '0 auto 40px',
        }}>
          Every layer of the protocol is designed for transparency, accountability, and long-term value.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
          marginTop: 40,
          textAlign: 'left',
        }}>
          {[
            { icon: 'L1', title: 'Multi-Level Referrals', desc: 'Earn commissions across three referral levels — L1 (10%), L2 (5%), L3 (3%) — automatically distributed on-chain.' },
            { icon: 'V', title: 'Verifiable History', desc: 'Every commission, every withdrawal, every transfer is recorded on-chain and visible in real time. No blind spots.' },
            { icon: 'S', title: 'Secure Wallets', desc: 'Integrated deposit wallet system. Manage earnings, track balance, and withdraw — all within the protocol.' },
            { icon: 'L', title: 'Live Leaderboard', desc: 'See where you rank. Top earners, team builders, and most active referrers — all updated in real time.' },
            { icon: 'P', title: 'Instant Payouts', desc: 'Commissions are credited the moment a referral completes a qualifying action. No delay, no manual processing.' },
            { icon: 'N', title: 'Polygon Native', desc: 'Built on Polygon for fast, low-cost transactions. Full ERC-20 compatibility with ONC token integration.' },
          ].map((card) => (
            <div key={card.icon} style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '32px 24px',
              transition: 'all .3s',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(167,139,250,0.1)',
                border: '1px solid rgba(167,139,250,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 700,
                marginBottom: 16,
              }}>{card.icon}</div>
              <h3 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 700,
                fontSize: 16,
                marginBottom: 8,
              }}>{card.title}</h3>
              <p style={{
                color: 'var(--text)',
                fontSize: 13,
                lineHeight: 1.7,
              }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how" style={{
        position: 'relative',
        zIndex: 1,
        padding: '100px 24px',
        maxWidth: 1100,
        margin: '0 auto',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: 'var(--primary)',
          marginBottom: 12,
        }}>How It Works</div>
        <h2 style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(28px, 4vw, 42px)',
          lineHeight: 1.15,
          marginBottom: 16,
        }}>Three steps to start earning.</h2>
        <p style={{
          color: 'var(--text)',
          fontSize: 15,
          lineHeight: 1.7,
          maxWidth: 560,
          margin: '0 auto 40px',
        }}>
          Join the protocol, share your referral link, and earn commissions as your network grows.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20,
          marginTop: 40,
          position: 'relative',
        }}>
          {/* connecting line */}
          <div style={{
            position: 'absolute',
            top: 40,
            left: '15%',
            right: '15%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, var(--border), transparent)',
          }} />
          {[
            { num: '1', title: 'Create Account', desc: 'Sign up with your email and connect your wallet. Your on-chain identity is established instantly.' },
            { num: '2', title: 'Share Your Link', desc: 'Get your unique referral link and share it. Your downline is tracked automatically — no manual work.' },
            { num: '3', title: 'Earn Commissions', desc: 'Earn from three levels of referrals. L1, L2, L3 — all paid out on-chain, instantly, transparently.' },
          ].map((step) => (
            <div key={step.num} style={{
              textAlign: 'center',
              padding: '32px 20px',
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                color: '#000',
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 800,
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                position: 'relative',
                zIndex: 1,
              }}>{step.num}</div>
              <h3 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 700,
                fontSize: 16,
                marginBottom: 8,
              }}>{step.title}</h3>
              <p style={{
                color: 'var(--text)',
                fontSize: 13,
                lineHeight: 1.7,
              }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Tokenomics ─── */}
      <section id="tokenomics" style={{
        position: 'relative',
        zIndex: 1,
        padding: '100px 24px',
        maxWidth: 1100,
        margin: '0 auto',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: 'var(--primary)',
          marginBottom: 12,
        }}>Tokenomics</div>
        <h2 style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(28px, 4vw, 42px)',
          lineHeight: 1.15,
          marginBottom: 16,
        }}>One token, clear job.</h2>
        <p style={{
          color: 'var(--text)',
          fontSize: 15,
          lineHeight: 1.7,
          maxWidth: 560,
          margin: '0 auto 40px',
        }}>
          ONC powers the ONCHYRA protocol — value, utility, and rewards, all in one.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: 32,
          marginTop: 40,
        }}>
          {[
            { num: 'ONC', lbl: 'Core Token', color: 'var(--primary)' },
            { num: 'ERC-20', lbl: 'Standard' },
            { num: 'Polygon', lbl: 'Network' },
            { num: 'Deflationary', lbl: 'Model', color: 'var(--accent)' },
          ].map((item) => (
            <div key={item.lbl} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 800,
                fontSize: 28,
                color: item.color ?? 'white',
              }}>{item.num}</div>
              <div style={{
                fontSize: 11,
                color: 'var(--text-dim)',
                marginTop: 4,
                textTransform: 'uppercase',
                letterSpacing: '.5px',
              }}>{item.lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{
        textAlign: 'center',
        padding: '100px 24px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.2), transparent)',
        }} />
        <h2 style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 900,
          fontSize: 'clamp(32px, 5vw, 52px)',
          maxWidth: 600,
          margin: '0 auto 16px',
        }}>Ready to build<br />your network?</h2>
        <p style={{
          color: 'var(--text)',
          fontSize: 15,
          maxWidth: 440,
          margin: '0 auto 32px',
          lineHeight: 1.7,
        }}>
          Join ONCHYRA and start earning on-chain referral commissions today. No hidden fees, no gatekeepers.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" style={{
            padding: '12px 28px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 13,
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
            border: 'none',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: '#000',
            boxShadow: '0 4px 24px rgba(167,139,250,0.25)',
          }}>
            Get Started
          </Link>
          <Link href="/login" style={{
            padding: '12px 28px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 13,
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            color: 'white',
            border: '1px solid var(--border)',
          }}>
            Sign In
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '32px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: 1100,
        margin: '0 auto',
        flexWrap: 'wrap',
        gap: 16,
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { label: 'Telegram', href: 'https://t.me/onchyra' },
            { label: 'X (Twitter)', href: 'https://x.com/onchyra' },
            { label: 'YouTube', href: 'https://youtube.com/@onchyra' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--text-dim)',
                textDecoration: 'none',
                fontSize: 12,
                transition: 'color .2s',
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          &copy; 2026 ONCHYRA Protocol
        </div>
      </footer>
    </>
  );
}
