'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/deposit', label: 'Deposit', icon: '💰' },
  { href: '/withdraw', label: 'Withdraw', icon: '💸' },
  { href: '/packages', label: 'Packages', icon: '📦' },
  { href: '/referrals', label: 'Referrals', icon: '👥' },
  { href: '/income', label: 'Income', icon: '📈' },
  { href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { href: '/profile', label: 'Profile', icon: '👤' },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-[101] md:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[102] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-[var(--bg2)] border-r border-white/[0.06] p-6 animate-slide-up">
            <div className="flex items-center gap-2 mb-8 font-[family-name:var(--font-space-grotesk)] font-black text-lg">
              <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
                ONCHYRA
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {menuItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm no-underline transition-all ${
                    pathname === item.href
                      ? 'bg-white/[0.06] text-white font-semibold'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/[0.03]'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
