'use client';

import Link from 'next/link';

export default function ContestsPage() {
  return (
    <div className="min-h-screen px-4 py-5 max-w-md mx-auto flex flex-col gap-3.5">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3.5">
        <Link href="/dashboard" className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06] text-white shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
        </Link>
        <span className="font-[family-name:var(--font-space-grotesk)] font-black text-lg bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent flex-1">
          ONCHYRA
        </span>
        <div className="w-9" />
      </div>

      {/* Title */}
      <h1 className="font-[family-name:var(--font-space-grotesk)] font-extrabold text-xl">Contests</h1>
      <p className="text-white/40 text-xs -mt-2">Compete and earn rewards</p>

      {/* Empty State */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-purple-500/[0.08] border border-purple-500/15 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
        <h3 className="font-[family-name:var(--font-space-grotesk)] font-extrabold text-lg mb-2">No Active Contest</h3>
        <p className="text-xs text-white/40 leading-relaxed max-w-xs mx-auto">
          There are no active referral contests at the moment. Check back soon for exciting competitions and prize pools.
        </p>
      </div>

      {/* Contest Info */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-5">
        <div className="text-[10px] font-extrabold text-[var(--primary)] uppercase tracking-wider mb-3">How Contests Work</div>
        <div className="space-y-3 text-xs text-white/50 leading-relaxed">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 text-[10px] font-extrabold text-[var(--primary)]">1</div>
            <span>Join the contest by submitting your POL (Polygon) wallet address</span>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 text-[10px] font-extrabold text-[var(--primary)]">2</div>
            <span>Invite new users during the contest period</span>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 text-[10px] font-extrabold text-[var(--primary)]">3</div>
            <span>Top referrers win POL prizes from the prize pool</span>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-red-500/[0.06] border border-red-500/15 rounded-2xl p-3.5 text-[11px] text-center text-red-300/80">
        Only new referrals joined AFTER your registration will be counted. Purging fake accounts will lead to permanent ban.
      </div>
    </div>
  );
}
