import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import type { ServiceCardData } from "@/lib/catalog";
import { startingPrice } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { durationShort } from "@/config/durations";
import { DemoBadge, VerifiedBadge } from "@/components/ui/badge";
import { ServiceArt } from "@/components/ui/service-art";
import { FavoriteButton } from "./favorite-button";
import { cn } from "@/lib/utils";

export type Availability = { capacity: number | null; inUse: number };

export function AvailabilityDot({ availability }: { availability?: Availability }) {
  if (!availability || availability.capacity === null) {
    return <span className="flex items-center gap-1.5 text-[11px] text-success"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Available now</span>;
  }
  const left = availability.capacity - availability.inUse;
  if (left <= 0) return <span className="flex items-center gap-1.5 text-[11px] text-danger"><span className="h-1.5 w-1.5 rounded-full bg-danger" /> Fully booked</span>;
  const low = left / availability.capacity < 0.2;
  return (
    <span className={cn("flex items-center gap-1.5 text-[11px]", low ? "text-warning" : "text-success")}>
      <span className={cn("h-1.5 w-1.5 rounded-full", low ? "bg-warning" : "bg-success")} /> {low ? `Only ${left} slots left` : "Available now"}
    </span>
  );
}

export function ServiceCard({ service, favorite = false, availability, className }: { service: ServiceCardData; favorite?: boolean; availability?: Availability; className?: string }) {
  const from = startingPrice(service);
  const cheapest = service.plans.find((p) => p.priceMinor === from);
  return (
    <article className={cn("group card-sheen relative flex h-full flex-col overflow-hidden rounded-2xl glass transition-[transform,box-shadow,border-color] duration-500 ease-out hover:-translate-y-1 hover:border-gold-400/30 hover:shadow-gold", className)}>
      <div className="relative">
        <ServiceArt seed={service.slug} accent={service.accent} icon={service.icon} className="aspect-[16/9] transition-transform duration-700 group-hover:scale-[1.03]" />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {service.isDemo && <DemoBadge />}
          {service.featured && <span className="rounded-full border border-gold-400/30 bg-black/50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-gold-200 uppercase backdrop-blur-sm">Featured</span>}
        </div>
        <FavoriteButton serviceId={service.id} initial={favorite} className="absolute top-3 right-3 z-10" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2 text-[11px] font-medium">
          <span style={{ color: service.category.accent }} className="tracking-wide uppercase">{service.category.name}</span>
          <AvailabilityDot availability={availability} />
        </div>
        <h3 className="mt-2 text-[17px] leading-snug font-semibold text-ivory">
          <Link href={`/marketplace/${service.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {service.name}
          </Link>
        </h3>
        <div className="mt-1 flex items-center gap-2 text-[13px] text-fog">
          <span className="truncate">by {service.seller.displayName}</span>
          {service.seller.verified && <VerifiedBadge />}
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-mist">{service.tagline}</p>
        <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Available plans">
          {service.plans.map((p) => (
            <span key={p.id} className="rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-[11px] text-mist">{durationShort(p.durationMinutes)}</span>
          ))}
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-[11px] text-fog">from</p>
            <p className="text-lg font-semibold text-ivory tabular-nums">
              {formatMoney(from)}
              {cheapest && <span className="text-xs font-normal text-fog"> / {durationShort(cheapest.durationMinutes).toLowerCase()}</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {service.ratingCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-mist" aria-label={`Rated ${service.ratingAvg} out of 5`}>
                <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" /> {service.ratingAvg.toFixed(1)}
              </span>
            )}
            <span className="inline-flex h-9 items-center gap-1 rounded-full bg-gold-400/10 px-3.5 text-xs font-semibold text-gold-200 transition-colors group-hover:bg-gold-400 group-hover:text-obsidian-950">
              Rent <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="skeleton aspect-[16/9]" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-10 w-full rounded" />
        <div className="skeleton h-8 w-full rounded" />
      </div>
    </div>
  );
}
