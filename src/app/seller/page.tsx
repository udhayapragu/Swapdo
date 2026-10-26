import Link from "next/link";
import { Banknote, Layers, Star, Timer } from "lucide-react";
import { db } from "@/lib/db";
import { requireSellerPage } from "@/lib/seller-context";
import { getPlatformSettings } from "@/lib/settings";
import { PageHeader } from "@/components/dashboard/shell";
import { Panel, PanelHeader, StatCard } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-pill";
import { formatMoney } from "@/lib/money";
import { formatDate, relativeTime } from "@/lib/utils";

export default async function SellerOverview() {
  const { seller } = await requireSellerPage();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const [settings, month, available, liveRentals, services, recent, auths, daily] = await Promise.all([
    getPlatformSettings(),
    db.commission.aggregate({ where: { sellerId: seller.id, createdAt: { gte: monthStart }, status: { not: "REVERSED" } }, _sum: { grossMinor: true, netMinor: true, commissionMinor: true }, _count: true }),
    db.commission.aggregate({ where: { sellerId: seller.id, status: "AVAILABLE", payoutId: null }, _sum: { netMinor: true } }),
    db.rental.count({ where: { service: { sellerId: seller.id }, status: "ACTIVE", endsAt: { gt: now } } }),
    db.service.findMany({ where: { sellerId: seller.id }, include: { _count: { select: { rentals: true } } }, orderBy: { popularity: "desc" } }),
    db.commission.findMany({ where: { sellerId: seller.id }, include: { order: { select: { description: true, number: true } } }, orderBy: { createdAt: "desc" }, take: 6 }),
    db.providerAuthorization.findMany({ where: { sellerId: seller.id }, orderBy: { createdAt: "desc" } }),
    db.commission.findMany({ where: { sellerId: seller.id, createdAt: { gte: new Date(now.getTime() - 30 * 86400000) }, status: { not: "REVERSED" } }, select: { netMinor: true, createdAt: true } }),
  ]);
  const approved = services.filter((s) => s.status === "APPROVED");
  const rating = approved.length ? approved.reduce((a, s) => a + s.ratingAvg, 0) / approved.length : 0;
  const buckets = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now.getTime() - (29 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    return { key, net: daily.filter((c) => c.createdAt.toISOString().slice(0, 10) === key).reduce((a, c) => a + c.netMinor, 0) };
  });
  const maxNet = Math.max(1, ...buckets.map((b) => b.net));

  return (
    <>
      <PageHeader eyebrow="Seller studio" title={seller.displayName} description={`Platform commission: ${(seller.commissionRateBps ?? settings.commissionRateBps) / 100}% · Minimum payout ${formatMoney(settings.minimumPayoutMinor)}`} action={<ButtonLink href="/seller/listings/new" size="sm">New listing</ButtonLink>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Net this month" value={formatMoney(month._sum.netMinor ?? 0)} hint={`${month._count} orders · ${formatMoney(month._sum.grossMinor ?? 0)} gross`} icon={<Banknote className="h-4 w-4" />} />
        <StatCard label="Available balance" value={formatMoney(available._sum.netMinor ?? 0)} hint={<Link href="/seller/payouts" className="text-gold-300">Request payout →</Link>} icon={<Banknote className="h-4 w-4" />} />
        <StatCard label="Live rentals" value={liveRentals} hint="Customers using your services now" icon={<Timer className="h-4 w-4" />} />
        <StatCard label="Listings" value={`${approved.length}/${services.length}`} hint={rating ? <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-gold-400 text-gold-400" /> {rating.toFixed(1)} avg rating</span> : "live / total"} icon={<Layers className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel>
          <PanelHeader title="Net earnings · last 30 days" />
          <div className="flex h-48 items-end gap-[3px] px-5 pt-6 pb-5 sm:px-6" role="img" aria-label="Daily net earnings for the last 30 days">
            {buckets.map((b) => <div key={b.key} className="flex-1 rounded-t bg-gradient-to-t from-violet-600/50 to-gold-300/90" style={{ height: `${Math.max(2, (b.net / maxNet) * 150)}px` }} title={`${b.key}: ${formatMoney(b.net)}`} />)}
          </div>
        </Panel>
        <Panel>
          <PanelHeader title="Recent orders" action={<Link href="/seller/orders" className="text-xs text-gold-300">All</Link>} />
          <ul className="divide-y divide-white/[0.05] px-5 py-2 text-sm sm:px-6">
            {recent.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0"><span className="block truncate text-ivory">{c.order.description}</span><span className="text-xs text-fog">{relativeTime(c.createdAt)}</span></span>
                <span className="text-right"><span className="block text-ivory tabular-nums">{formatMoney(c.netMinor)}</span><span className="text-xs text-fog">net</span></span>
              </li>
            ))}
            {recent.length === 0 && <li className="py-6 text-center text-fog">No orders yet.</li>}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel>
          <PanelHeader title="Listing performance" action={<Link href="/seller/listings" className="text-xs text-gold-300">Manage</Link>} />
          <ul className="divide-y divide-white/[0.05] px-5 py-2 text-sm sm:px-6">
            {services.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="text-ivory">{s.name}</span>
                <span className="flex items-center gap-4 text-xs text-fog"><span>{s._count.rentals} rentals</span>{s.ratingCount > 0 && <span>★ {s.ratingAvg.toFixed(1)}</span>}<StatusBadge status={s.status} /></span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <PanelHeader title="Authorizations" description="Listings must reference an approved authorization." />
          <ul className="space-y-2 p-5 sm:p-6">
            {auths.map((a) => (
              <li key={a.id} className="rounded-xl border hairline p-3 text-sm">
                <div className="flex items-center justify-between gap-2"><span className="text-ivory">{a.title}</span><StatusBadge status={a.status} /></div>
                <p className="mt-1 text-xs text-fog">{a.kind.replace(/_/g, " ").toLowerCase()} · {a.reference}{a.validUntil && ` · valid until ${formatDate(a.validUntil)}`}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
