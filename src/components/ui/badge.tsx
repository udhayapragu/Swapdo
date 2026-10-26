import type { ReactNode } from "react";
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-white/[0.05] text-mist border-white/10",
  gold: "bg-gold-400/10 text-gold-200 border-gold-400/25",
  violet: "bg-violet-500/12 text-violet-300 border-violet-400/25",
  success: "bg-success/10 text-success border-success/25",
  warning: "bg-warning/10 text-warning border-warning/25",
  danger: "bg-danger/10 text-danger border-danger/25",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({ tone = "neutral", className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap", tones[tone], className)}>
      {children}
    </span>
  );
}

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold text-gold-300", className)} title="Identity and authorization verified by SWAPDO">
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Verified
    </span>
  );
}

