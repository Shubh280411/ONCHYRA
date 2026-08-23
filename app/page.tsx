import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center">
      <div className="mb-6">
        <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="url(#logo-grad)" />
          <path d="M10 22V10h4l4 6 4-6h4v12h-3.5v-7.5L19 18l-3.5-3.5V22H10z" fill="#000" />
          <defs>
            <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32">
              <stop stopColor="#a78bfa" />
              <stop offset="1" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-space-grotesk)] font-black mb-4">
        <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
          ONCHYRA
        </span>
      </h1>
      <p className="text-white/40 text-sm mb-8 max-w-md">
        Decentralised Referral Protocol — Mine, Earn, Build Your Network
      </p>
      <div className="flex gap-3">
        <Link
          href="/register"
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-black font-[family-name:var(--font-space-grotesk)] font-bold text-sm no-underline hover:opacity-90 transition-opacity"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-[family-name:var(--font-space-grotesk)] font-bold text-sm no-underline hover:bg-white/10 transition-colors"
        >
          Login
        </Link>
      </div>
    </div>
  );
}
