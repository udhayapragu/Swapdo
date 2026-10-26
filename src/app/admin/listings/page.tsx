import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/shell";
import { DataTable } from "@/components/dashboard/data-table";
import { ActionButton } from "@/components/admin/action-button";
import { StatusBadge } from "@/components/ui/status-pill";
import { formatMoney } from "@/lib/money";
import { durationShort } from "@/config/durations";

export const metadata: Metadata = { title: "Listings" };

export default async function AdminListingsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requirePageUser({ roles: ["ADMIN"] });
  const { status = "PENDING_REVIEW" } = await searchParams;
  const filter = ["PENDING_REVIEW", "APPROVED", "REJECTED", "SUSPENDED", "DRAFT"].includes(status) ? status : "PENDING_REVIEW";
  const [services, counts] = await Promise.all([
    db.service.findMany({
      where: { status: filter as "PENDING_REVIEW" },
      include: { seller: { select: { displayName: true, status: true } }, category: { select: { name: true } }, authorization: true, plans: { orderBy: { durationMinutes: "asc" } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.service.groupBy({ by: ["status"], _count: true }),
  ]);
  return (
    <>
      <PageHeader title="Listing moderation" description="Listings go live only with an approved seller and an approved authorization." />
      <div className="mb-5 flex gap-2 overflow-x-auto scrollbar-none">
        {["PENDING_REVIEW", "APPROVED", "REJECTED", "SUSPENDED", "DRAFT"].map((s) => (
          <Link key={s} href={`/admin/listings?status=${s}`} className={`shrink-0 rounded-full px-4 py-2 text-sm ${filter === s ? "bg-white/[0.08] text-ivory" : "text-fog hover:text-ivory"}`}>
            {s.replace("_", " ").toLowerCase()} <span className="text-fog">{counts.find((c) => c.status === s)?._count ?? 0}</span>
          </Link>
        ))}
      </div>
      <DataTable head={["Listing", "Seller / authorization", "Plans", "Status", ""]}>
        {services.map((s) => (
          <tr key={s.id}>
            <td className="max-w-sm">
              <p className="flex items-center gap-2 font-medium text-ivory">{s.name}</p>
              <p className="text-xs text-fog">{s.category.name} · {s.accessMethod.replace(/_/g, " ").toLowerCase()}</p>
              <p className="mt-1 text-xs text-mist line-clamp-2">{s.tagline}</p>
            </td>
            <td className="text-xs">
              <p className="text-ivory">{s.seller.displayName} <StatusBadge status={s.seller.status} /></p>
              {s.authorization ? <p className="mt-1 text-fog">{s.authorization.title} · <StatusBadge status={s.authorization.status} /></p> : <p className="mt-1 text-danger">No authorization</p>}
            </td>
            <td><div className="flex flex-wrap gap-1">{s.plans.map((p) => <span key={p.id} className="rounded border border-white/10 px-1.5 py-0.5 text-[11px] text-mist">{durationShort(p.durationMinutes)} {formatMoney(p.priceMinor)}</span>)}</div></td>
            <td><StatusBadge status={s.status} /></td>
            <td>
              <div className="flex justify-end gap-1">
                {s.status !== "APPROVED" && <ActionButton endpoint={`/api/admin/listings/${s.id}`} body={{ decision: "approve" }} label="Approve" variant="outline" withNotes success="Listing approved" />}
                {s.status === "PENDING_REVIEW" && <ActionButton endpoint={`/api/admin/listings/${s.id}`} body={{ decision: "reject" }} label="Reject" withNotes success="Listing rejected" />}
                {s.status === "APPROVED" && <ActionButton endpoint={`/api/admin/listings/${s.id}`} body={{ decision: "suspend" }} label="Suspend" variant="danger" withNotes success="Listing suspended" />}
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
      {services.length === 0 && <p className="mt-6 text-center text-sm text-fog">Nothing here.</p>}
    </>
  );
}
