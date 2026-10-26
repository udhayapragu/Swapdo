import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/shell";
import { DataTable } from "@/components/dashboard/data-table";
import { ActionButton } from "@/components/admin/action-button";
import { StatusBadge } from "@/components/ui/status-pill";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Fraud monitoring" };

export default async function AdminFraudPage() {
  await requirePageUser({ roles: ["ADMIN"] });
  const flags = await db.fraudFlag.findMany({ include: { user: { select: { email: true, id: true, status: true } }, order: { select: { number: true } } }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] });
  return (
    <>
      <PageHeader title="Fraud monitoring" description="Automatic flags from order velocity, repeated payment failures and amount mismatches. Nothing is auto-blocked — review and act." />
      <DataTable head={["Signal", "User", "Order", "Severity", "Raised", "Status", ""]}>
        {flags.map((f) => (
          <tr key={f.id}>
            <td className="text-ivory">{f.reason}</td>
            <td className="text-xs text-fog">{f.user?.email ?? "—"}</td>
            <td className="font-mono text-[11px] text-fog">{f.order?.number ?? "—"}</td>
            <td><Badge tone={f.severity === "high" ? "danger" : "warning"}>{f.severity}</Badge></td>
            <td className="text-xs text-fog">{formatDateTime(f.createdAt)}</td>
            <td><StatusBadge status={f.status} /></td>
            <td><div className="flex justify-end gap-1">
              {f.status === "OPEN" && <ActionButton endpoint={`/api/admin/fraud/${f.id}`} method="PATCH" body={{ status: "DISMISSED" }} label="Dismiss" success="Flag dismissed" />}
              {f.status === "OPEN" && <ActionButton endpoint={`/api/admin/fraud/${f.id}`} method="PATCH" body={{ status: "CONFIRMED" }} label="Confirm" variant="danger" success="Flag confirmed" />}
              {f.user && f.user.status === "ACTIVE" && f.status === "CONFIRMED" && <ActionButton endpoint={`/api/admin/users/${f.user.id}`} method="PATCH" body={{ status: "SUSPENDED" }} label="Suspend user" variant="danger" confirm="Suspend this user and revoke their sessions?" success="User suspended" />}
            </div></td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
