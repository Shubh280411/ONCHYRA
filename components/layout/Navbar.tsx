'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/packages', label: 'Packages' },
  { href: '/deposit', label: 'Deposit' },
  { href: '/withdraw', label: 'Withdraw' },
  { href: '/referrals', label: 'Referrals' },
  { href: '/leaderboard', label: 'Leaderboard' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] px-5 py-4 flex justify-between items-center backdrop-blur-xl bg-[var(--bg)]/60 border-b border-white/[0.06]">
      <Link href="/dashboard" className="flex items-center gap-2.5 font-[family-name:var(--font-space-grotesk)] font-black text-lg no-underline text-white">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="url(#logo-grad)" />
          <path d="M10 22V10h4l4 6 4-6h4v12h-3.5v-7.5L19 18l-3.5-3.5V22H10z" fill="#000" />
          <defs>
            <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32">
              <stop stopColor="#a78bfa" />
              <stop offset="1" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
        </svg>
        <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
          ONCHYRA
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-7 list-none">
        {navLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-[13px] font-medium no-underline transition-colors relative ${
              pathname === link.href
                ? 'text-white'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {link.label}
            {pathname === link.href && (
              <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-full" />
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
