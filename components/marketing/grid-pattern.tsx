export function GridPattern({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 opacity-[0.35] ${className}`}
      aria-hidden
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 75%)',
      }}
    />
  );
}

export function DotGridTransition() {
  return (
    <div
      className="h-16 w-full bg-white"
      aria-hidden
      style={{
        backgroundImage: 'radial-gradient(circle, #0f172a 1.5px, transparent 1.5px)',
        backgroundSize: '12px 12px',
        maskImage: 'linear-gradient(to bottom, black, transparent)',
      }}
    />
  );
}
