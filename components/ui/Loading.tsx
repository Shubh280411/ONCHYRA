export default function Loading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[var(--bg)]">
      <div className="w-10 h-10 border-2 border-white/10 border-t-[var(--primary)] rounded-full animate-spin mb-4" />
      <p className="text-white/30 text-xs uppercase tracking-widest">{text}</p>
    </div>
  );
}
