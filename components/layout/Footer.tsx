import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-8 px-5 mt-12">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-[family-name:var(--font-space-grotesk)] font-black text-sm">
          <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
            ONCHYRA
          </span>
          <span className="text-white/20 font-normal text-xs">Decentralised Mining Platform</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/roadmap" className="text-xs text-white/25 hover:text-white/50 no-underline transition-colors">Roadmap</Link>
          <Link href="/tokenomics" className="text-xs text-white/25 hover:text-white/50 no-underline transition-colors">Tokenomics</Link>
          <Link href="/whitepaper" className="text-xs text-white/25 hover:text-white/50 no-underline transition-colors">Whitepaper</Link>
        </div>
      </div>
    </footer>
  );
}
