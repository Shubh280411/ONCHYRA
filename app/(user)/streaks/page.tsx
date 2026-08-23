'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function StreaksPage() {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMove(x: number, y: number) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const rotateY = ((x / w) - 0.5) * 40;
      const rotateX = ((y / h) - 0.5) * -40;
      if (cardRef.current) {
        cardRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      }
    }

    function onMouseMove(e: MouseEvent) { handleMove(e.clientX, e.clientY); }
    function onTouchMove(e: TouchEvent) { const t = e.touches[0]; handleMove(t.clientX, t.clientY); }
    function reset() { if (cardRef.current) cardRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)'; }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('mouseleave', reset);
    document.addEventListener('touchend', reset);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('mouseleave', reset);
      document.removeEventListener('touchend', reset);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden font-[family-name:var(--font-space-grotesk)] perspective-[1200px]">
      <div className="absolute w-[250px] h-[250px] bg-[var(--primary)] filter blur-[120px] opacity-20 z-[-1]" />
      <div
        ref={cardRef}
        className="bg-white/[0.04] backdrop-blur-[15px] rounded-[30px] p-[50px_20px] w-[90%] max-w-[400px] text-center transition-transform duration-200 ease-out shadow-[0_40px_120px_rgba(0,0,0,0.8)]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div
          className="text-5xl font-black leading-none uppercase bg-gradient-to-r from-white via-[var(--primary)] to-white bg-[length:200%] bg-clip-text text-transparent"
          style={{ animation: 'shine 3s linear infinite', transform: 'translateZ(80px)' }}
        >
          COMING<br />SOON
        </div>
        <div className="mt-5 text-sm tracking-[4px] text-[var(--primary)]" style={{ transform: 'translateZ(50px)' }}>
          STREAK SYSTEM
        </div>
        <div className="mt-5 text-[13px] text-white/60 leading-relaxed" style={{ transform: 'translateZ(40px)' }}>
          Stay active. Earn more rewards.<br />
          Don&apos;t break your streak.<br /><br />
          Launching soon... early users benefit the most.
        </div>
        <Link
          href="/dashboard"
          className="mt-7 inline-block px-6 py-3 rounded-[25px] bg-gradient-to-r from-[var(--primary)] to-purple-700 text-white font-bold cursor-pointer transition-all hover:scale-105 no-underline"
          style={{ transform: 'translateZ(60px)' }}
        >
          Go Back
        </Link>
      </div>
      <style>{`@keyframes shine { to { background-position: 200%; } }`}</style>
    </div>
  );
}
