import { cn } from "@/lib/utils";

/**
 * SWAPDO mark: an open "S" formed by two counter-rotating arcs — two parties
 * exchanging access — inside a faceted diamond frame.
 */
export function LogoMark({ className, animated = false }: { className?: string; animated?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-8 w-8", className)} aria-hidden fill="none">
      <defs>
        <linearGradient id="swapdo-g" x1="6" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f6e7c4" />
          <stop offset="0.5" stopColor="#c9a45f" />
          <stop offset="1" stopColor="#a68cff" />
        </linearGradient>
      </defs>
      <rect x="7.5" y="7.5" width="25" height="25" rx="6" transform="rotate(45 20 20)" stroke="url(#swapdo-g)" strokeOpacity="0.45" strokeWidth="1.2" />
      <path
        d="M25.5 13.2a6.4 6.4 0 1 0-5.5 6.8 6.4 6.4 0 1 1-5.5 6.8"
        stroke="url(#swapdo-g)"
        strokeWidth="2.4"
        strokeLinecap="round"
        className={animated ? "[stroke-dasharray:60] [stroke-dashoffset:60] animate-[draw_1.4s_0.2s_cubic-bezier(.65,0,.35,1)_forwards]" : undefined}
      />
      <circle cx="25.5" cy="13.2" r="1.7" fill="#f3e3bd" />
      <circle cx="14.5" cy="26.8" r="1.7" fill="#a68cff" />
      <style>{`@keyframes draw{to{stroke-dashoffset:0}}`}</style>
    </svg>
  );
}

export function Logo({ className, animated = false }: { className?: string; animated?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark animated={animated} />
      <span className="text-[15px] font-bold tracking-[0.32em] text-ivory">
        SWAP<span className="text-gold">DO</span>
      </span>
    </span>
  );
}
