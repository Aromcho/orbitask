import { cn } from "@/lib/utils";

/** Isotipo de Orbitask: un planeta con su anillo. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cn("size-8", className)} aria-hidden>
      <defs>
        <linearGradient id="orbitask-planet" x1="8" y1="6" x2="24" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a99df9" />
          <stop offset="1" stopColor="#6d5bea" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="8" fill="url(#orbitask-planet)" />
      <ellipse cx="16" cy="16" rx="14" ry="5" transform="rotate(-22 16 16)" stroke="#2dd4bf" strokeWidth="1.6" strokeOpacity="0.85" />
      <circle cx="27.4" cy="11.2" r="1.8" fill="#fbbf24" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-heading text-lg font-semibold tracking-tight">Orbitask</span>
    </div>
  );
}
