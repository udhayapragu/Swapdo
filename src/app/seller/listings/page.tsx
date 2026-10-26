import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireSellerPage } from "@/lib/seller-context";
import { PageHeader } from "@/components/dashboard/shell";
import { DataTable } from "@/components/dashboard/data-table";
import { ListingActions } from "@/components/seller/listing-actions";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-pill";
import { ServiceArt } from "@/components/ui/service-art";
import { formatMoney } from "@/lib/money";
import { durationShort } from "@/config/durations";

export const metadata: Metadata = { title: "Listings" };

export default async function SellerListingsPage() {
  const { seller } = await requireSellerPage();
  const now = new Date();
  const services = await db.service.findMany({
    where: { sellerId: seller.id },
    include: { plans: { orderBy: { durationMinutes: "asc" } }, category: { select: { name: true } }, _count: { select: { rentals: { where: { status: "ACTIVE", endsAt: { gt: now } } } } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <>
      <PageHeader title="Listings" description="Configure durations, prices and availability. New listings require moderation." action={<ButtonLink href="/seller/listings/new" size="sm">New listing</ButtonLink>} />
      <DataTable head={["Service", "Plans", "Live rentals", "Status", ""]}>
        {services.map((s) => (
          <tr key={s.id}>
            <td>
              <div className="flex items-center gap-3">
                <ServiceArt seed={s.slug} accent={s.accent} icon={s.icon} size="sm" className="h-10 w-10 shrink-0 rounded-xl" />
                <div className="min-w-0">
                  {s.status === "APPROVED" ? <Link href={`/marketplace/${s.slug}`} className="font-medium text-ivory hover:text-gold-200">{s.name}</Link> : <span className="font-medium text-ivory">{s.name}</span>}
                  <p className="text-xs text-fog">{s.category.name}{s.capacity ? ` · capacity ${s.capacity}` : ""}</p>
                  {s.moderationNotes && s.status !== "APPROVED" && <p className="mt-0.5 text-xs text-warning">Note: {s.moderationNotes}</p>}
                </div>
              </div>
            </td>
            <td><div className="flex flex-wrap gap-1">{s.plans.map((p) => <span key={p.id} className={`rounded-md border px-1.5 py-0.5 text-[11px] ${p.active ? "border-white/10 text-mist" : "border-white/5 text-smoke line-through"}`}>{durationShort(p.durationMinutes)} · {formatMoney(p.priceMinor)}</span>)}</div></td>
            <td className="text-ivory tabular-nums">{s._count.rentals}</td>
            <td><StatusBadge status={s.status} /></td>
            <td><ListingActions id={s.id} status={s.status} plans={s.plans.map((p) => ({ id: p.id, durationMinutes: p.durationMinutes, priceMinor: p.priceMinor, active: p.active }))} /></td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
