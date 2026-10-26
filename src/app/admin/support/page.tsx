import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/shell";
import { DataTable } from "@/components/dashboard/data-table";
import { ActionButton } from "@/components/admin/action-button";
import { StatusBadge } from "@/components/ui/status-pill";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Support tickets" };

export default async function AdminSupportPage() {
  await requirePageUser({ roles: ["ADMIN"] });
  const tickets = await db.supportTicket.findMany({ include: { user: { select: { email: true } }, seller: { select: { displayName: true } } }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] });
  return (
    <>
      <PageHeader title="Support tickets" />
      <DataTable head={["Ticket", "From", "Seller", "Opened", "Status", ""]}>
        {tickets.map((t) => (
          <tr key={t.id}>
            <td className="max-w-sm"><p className="text-ivory">{t.subject} {t.priority === "high" && <Badge tone="danger">high</Badge>}</p><p className="text-xs text-mist line-clamp-2">{t.body}</p></td>
            <td className="text-xs text-fog">{t.user.email}</td>
            <td className="text-xs text-fog">{t.seller?.displayName ?? "—"}</td>
            <td className="text-xs text-fog">{relativeTime(t.createdAt)}</td>
            <td><StatusBadge status={t.status} /></td>
            <td><div className="flex justify-end gap-1">
              {t.status !== "PENDING" && t.status !== "RESOLVED" && <ActionButton endpoint={`/api/admin/tickets/${t.id}`} method="PATCH" body={{ status: "PENDING" }} label="Pending" success="Ticket updated" />}
              {t.status !== "RESOLVED" && <ActionButton endpoint={`/api/admin/tickets/${t.id}`} method="PATCH" body={{ status: "RESOLVED" }} label="Resolve" variant="outline" success="Ticket resolved" />}
            </div></td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
