import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/shell";
import { DataTable } from "@/components/dashboard/data-table";
import { ActionButton } from "@/components/admin/action-button";
import { StatusBadge } from "@/components/ui/status-pill";
import { DemoBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Sellers" };

export default async function AdminSellersPage() {
  await requirePageUser({ roles: ["ADMIN"] });
  const sellers = await db.seller.findMany({
    include: { user: { select: { email: true } }, authorizations: true, _count: { select: { services: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  const order = { PENDING: 0, APPROVED: 1, SUSPENDED: 2, REJECTED: 3 } as const;
  sellers.sort((a, b) => order[a.status] - order[b.status]);
  return (
    <>
      <PageHeader title="Sellers" description="Review provider applications and their authorization evidence." />
      <DataTable head={["Provider", "Authorization", "Listings", "Joined", "Status", ""]}>
        {sellers.map((s) => (
          <tr key={s.id}>
            <td>
              <p className="flex items-center gap-2 font-medium text-ivory">{s.displayName} {s.isDemo && <DemoBadge label="Demo" />}</p>
              <p className="text-xs text-fog">{s.user.email}</p>
              <p className="mt-1 max-w-xs text-xs text-mist line-clamp-2">{s.bio}</p>
            </td>
            <td>
              {s.authorizations.map((a) => (
                <div key={a.id} className="mb-1 text-xs">
                  <span className="text-ivory">{a.title}</span> <span className="text-fog">· {a.kind.replace(/_/g, " ").toLowerCase()} · {a.reference}</span>
                  {a.documentUrl && <a href={a.documentUrl} target="_blank" rel="noopener noreferrer nofollow" className="ml-1 text-gold-300">document</a>}
                  <span className="ml-1"><StatusBadge status={a.status} /></span>
                </div>
              ))}
            </td>
            <td className="tabular-nums">{s._count.services}</td>
            <td className="text-fog">{formatDate(s.createdAt)}</td>
            <td><StatusBadge status={s.status} /></td>
            <td>
              <div className="flex justify-end gap-1">
                {s.status !== "APPROVED" && <ActionButton endpoint={`/api/admin/sellers/${s.id}`} body={{ decision: "approve" }} label="Approve" variant="outline" withNotes success="Seller approved" />}
                {s.status === "PENDING" && <ActionButton endpoint={`/api/admin/sellers/${s.id}`} body={{ decision: "reject" }} label="Reject" withNotes success="Application rejected" />}
                {s.status === "APPROVED" && <ActionButton endpoint={`/api/admin/sellers/${s.id}`} body={{ decision: "suspend" }} label="Suspend" variant="danger" withNotes confirm="Suspending a seller also suspends all their live listings." success="Seller suspended" />}
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
