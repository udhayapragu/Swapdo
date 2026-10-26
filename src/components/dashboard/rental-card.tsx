import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Countdown } from "@/components/ui/countdown";
import { RentalStatusPill } from "@/components/ui/status-pill";
import { ServiceArt } from "@/components/ui/service-art";
import { effectiveStatus, progress } from "@/lib/rentals/engine";
import { durationLabel } from "@/config/durations";
import { formatDateTime } from "@/lib/utils";

export type RentalCardData = {
  id: string;
  status: "PENDING_PAYMENT" | "ACTIVE" | "EXPIRED" | "CANCELLED" | "REFUNDED";
  startsAt: Date | null;
  endsAt: Date | null;
  durationMinutes: number;
  usageCount: number;
  usageLimit: number | null;
  service: { name: string; slug: string; accent: string; icon: string };
  plan: { usageUnit: string };
};

export function RentalCard({ rental, now }: { rental: RentalCardData; now: Date }) {
  const status = effectiveStatus(rental, now);
  const live = status === "ACTIVE" || status === "EXPIRING_SOON";
  const pct = progress(rental, now);
  return (
    <Link href={`/dashboard/rentals/${rental.id}`} className="group glass flex flex-col gap-4 rounded-2xl p-4 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-gold-400/30 sm:flex-row sm:items-center sm:p-5">
      <ServiceArt seed={rental.service.slug} accent={rental.service.accent} icon={rental.service.icon} size="sm" className="h-14 w-14 shrink-0 rounded-2xl" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold text-ivory">{rental.service.name}</p>
          <RentalStatusPill status={status} />
        </div>
        <p className="mt-0.5 text-xs text-fog">
          {durationLabel(rental.durationMinutes)} · {rental.endsAt ? (live ? `ends ${formatDateTime(rental.endsAt)}` : `ended ${formatDateTime(rental.endsAt)}`) : "awaiting payment"}
        </p>
        {live && (
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5" role="progressbar" aria-valuenow={Math.round((1 - pct) * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Time remaining">
            <div className={status === "EXPIRING_SOON" ? "h-full rounded-full bg-gradient-to-r from-warning to-gold-400" : "h-full rounded-full bg-gradient-to-r from-gold-300 to-violet-400"} style={{ width: `${Math.max(2, (1 - pct) * 100)}%` }} />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-6 sm:justify-end">
        {rental.usageLimit !== null && (
          <div className="text-right">
            <p className="text-[10px] tracking-wide text-fog uppercase">Usage</p>
            <p className="text-sm text-ivory tabular-nums">{rental.usageCount.toLocaleString("en-IN")}<span className="text-fog">/{rental.usageLimit.toLocaleString("en-IN")}</span></p>
          </div>
        )}
        {live && rental.endsAt && (
          <div className="text-right">
            <p className="text-[10px] tracking-wide text-fog uppercase">Remaining</p>
            <Countdown endsAt={rental.endsAt.toISOString()} serverNow={now.toISOString()} className={status === "EXPIRING_SOON" ? "text-base text-warning" : "text-base text-gold-200"} />
          </div>
        )}
        <ArrowUpRight className="h-4 w-4 shrink-0 text-fog transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ivory" />
      </div>
    </Link>
  );
}
