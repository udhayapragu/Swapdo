import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PartyPopper } from "lucide-react";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { effectiveStatus } from "@/lib/rentals/engine";
import { getPlatformSettings } from "@/lib/settings";
import { PageHeader } from "@/components/dashboard/shell";
import { CountdownRing, RentalConsole } from "@/components/dashboard/rental-console";
import { RentalStatusPill } from "@/components/ui/status-pill";
import { ServiceArt } from "@/components/ui/service-art";
import { durationLabel } from "@/config/durations";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Rental" };

export default async function RentalDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ welcome?: string }> }) {
  const user = await requirePageUser();
  const { id } = await params;
  const { welcome } = await searchParams;
  const now = new Date();
  const rental = await db.rental.findUnique({
    where: { id },
    include: {
      service: { include: { plans: { where: { active: true }, orderBy: { durationMinutes: "asc" } }, seller: { select: { displayName: true } } } },
      plan: true,
      orders: { orderBy: { createdAt: "asc" }, include: { refunds: true } },
      usage: { orderBy: { createdAt: "desc" }, take: 6 },
    },
  });
  if (!rental || rental.userId !== user.id) notFound();

  const status = effectiveStatus(rental, now);
  const live = status === "ACTIVE" || status === "EXPIRING_SOON";
  const pending = status === "PENDING_PAYMENT";
  const { refundWindowHours } = await getPlatformSettings();
  const firstOrder = rental.orders.find((o) => o.purpose === "RENTAL_NEW");
  const refundable =
    firstOrder && firstOrder.status === "PAID" && firstOrder.paidAt && now.getTime() - firstOrder.paidAt.getTime() < refundWindowHours * 3600_000 && !firstOrder.refunds.some((r) => r.status !== "REJECTED")
      ? { orderId: firstOrder.id }
      : null;
  const pendingRefund = rental.orders.flatMap((o) => o.refunds).find((r) => r.status === "REQUESTED");
  const usagePct = rental.usageLimit ? Math.min(100, (rental.usageCount / rental.usageLimit) * 100) : null;

  return (
    <>
      <Link href="/dashboard/rentals" className="mb-6 inline-flex items-center gap-1.5 text-sm text-fog hover:text-ivory"><ArrowLeft className="h-4 w-4" /> Rentals</Link>
      {welcome && live && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-gold-400/25 bg-gold-400/[0.06] px-4 py-3 text-sm text-gold-100">
          <PartyPopper className="h-4 w-4 text-gold-300" /> Payment verified — your access is live.
        </div>
      )}
      <PageHeader
        title={rental.service.name}
        description={`by ${rental.service.seller.displayName} · ${durationLabel(rental.durationMinutes)} rental`}
        action={<div className="flex items-center gap-2"><RentalStatusPill status={status} /></div>}
      />

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <div className="glass relative overflow-hidden rounded-3xl p-6">
            <ServiceArt seed={rental.service.slug} accent={rental.service.accent} icon={rental.service.icon} className="absolute inset-0 opacity-30" hideIcon />
            <div className="relative">
              <CountdownRing startsAt={rental.startsAt?.toISOString() ?? null} endsAt={rental.endsAt?.toISOString() ?? null} serverNow={now.toISOString()} live={live} />
              <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-black/30 p-3"><dt className="text-[10px] tracking-wide text-fog uppercase">Started</dt><dd className="mt-0.5 text-ivory">{rental.startsAt ? formatDateTime(rental.startsAt) : "—"}</dd></div>
                <div className="rounded-xl bg-black/30 p-3"><dt className="text-[10px] tracking-wide text-fog uppercase">{live ? "Ends" : "Ended"}</dt><dd className="mt-0.5 text-ivory">{rental.endsAt ? formatDateTime(rental.endsAt) : "—"}</dd></div>
              </dl>
              <p className="mt-4 text-center text-[11px] text-fog">Timed by SWAPDO’s servers. Changing your device clock has no effect on access.</p>
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-ivory">Usage</span>
              <span className="text-mist tabular-nums">{rental.usageCount.toLocaleString("en-IN")}{rental.usageLimit !== null ? ` / ${rental.usageLimit.toLocaleString("en-IN")}` : ""} {rental.plan.usageUnit}</span>
            </div>
            {usagePct !== null ? (
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5"><div className={usagePct > 85 ? "h-full rounded-full bg-warning" : "h-full rounded-full bg-gradient-to-r from-gold-300 to-gold-500"} style={{ width: `${usagePct}%` }} /></div>
            ) : (
              <p className="mt-2 text-xs text-fog">Fair-use access — no fixed limit.</p>
            )}
            {rental.usage.length > 0 && (
              <ul className="mt-4 space-y-1.5 text-xs text-fog">
                {rental.usage.map((u) => <li key={u.id} className="flex justify-between"><span>{u.action}</span><span>{formatDateTime(u.createdAt)}</span></li>)}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {pendingRefund && <div className="rounded-2xl border border-violet-400/25 bg-violet-500/[0.06] px-4 py-3 text-sm text-violet-200">Refund requested on {formatDateTime(pendingRefund.createdAt)} — under review.</div>}
          <RentalConsole
            rentalId={rental.id}
            live={live}
            pending={pending}
            usageUnit={rental.plan.usageUnit}
            usageCount={rental.usageCount}
            usageLimit={rental.usageLimit}
            plans={rental.service.status === "APPROVED" ? rental.service.plans.map((p) => ({ id: p.id, durationMinutes: p.durationMinutes, priceMinor: p.priceMinor })) : []}
            refundable={refundable}
            accessMethod={rental.service.accessMethod}
          />
          <div className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-ivory">Orders for this rental</h2>
            <ul className="mt-3 divide-y divide-white/[0.05] text-sm">
              {rental.orders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span className="text-mist">{o.description}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-ivory tabular-nums">{formatMoney(o.totalMinor, true)}</span>
                    <span className="text-xs text-fog">{o.status.toLowerCase()}</span>
                    {o.status === "PAID" && <Link href={`/dashboard/billing/${o.id}`} className="text-xs text-gold-300">Invoice</Link>}
                    {(o.status === "PENDING" || o.status === "FAILED") && <Link href={`/checkout/${o.id}`} className="text-xs text-gold-300">Pay</Link>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
