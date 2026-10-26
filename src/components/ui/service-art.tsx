import { ServiceIcon } from "./icon";
import { cn } from "@/lib/utils";

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Deterministic abstract artwork per service — no image downloads required. */
export function ServiceArt({ seed, accent, icon, className, size = "md", hideIcon = false }: { seed: string; accent: string; icon: string; className?: string; size?: "sm" | "md" | "lg"; hideIcon?: boolean }) {
  const h = hash(seed);
  const x1 = 20 + (h % 50), y1 = 15 + ((h >> 5) % 50), x2 = 50 + ((h >> 9) % 40), y2 = 40 + ((h >> 13) % 50);
  const rot = (h >> 3) % 360;
  return (
    <div className={cn("relative isolate overflow-hidden bg-obsidian-850", className)} aria-hidden>
      <div className="absolute inset-0" style={{ background: `radial-gradient(60% 70% at ${x1}% ${y1}%, ${accent}40, transparent 70%), radial-gradient(50% 60% at ${x2}% ${y2}%, #6a4fd133, transparent 70%)` }} />
      <div
        className="absolute -inset-1/2 opacity-[0.18]"
        style={{ background: `conic-gradient(from ${rot}deg at 50% 50%, transparent 0deg, ${accent} 40deg, transparent 90deg, transparent 200deg, #ffffff 230deg, transparent 260deg)` }}
      />
      <svg className="absolute inset-0 h-full w-full opacity-[0.12]" preserveAspectRatio="none">
        <defs>
          <pattern id={`grid-${seed}`} width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M22 0H0V22" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${seed})`} />
      </svg>
      {!hideIcon && <div className="absolute inset-0 grid place-items-center">
        <div
          className={cn("grid place-items-center rounded-2xl border border-white/15 bg-black/30 backdrop-blur-[2px]", size === "sm" ? "h-10 w-10" : size === "lg" ? "h-20 w-20 rounded-3xl" : "h-14 w-14")}
          style={{ boxShadow: `0 0 40px -6px ${accent}70` }}
        >
          <ServiceIcon name={icon} className={cn(size === "sm" ? "h-5 w-5" : size === "lg" ? "h-9 w-9" : "h-6 w-6")} />
        </div>
      </div>}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-obsidian-900/70 to-transparent" />
    </div>
  );
}
