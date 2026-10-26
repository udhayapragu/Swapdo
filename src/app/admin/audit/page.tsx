import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/shell";
import { DataTable } from "@/components/dashboard/data-table";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Audit log" };

export default async function AdminAuditPage() {
  await requirePageUser({ roles: ["ADMIN"] });
  const logs = await db.auditLog.findMany({ include: { actor: { select: { email: true } } }, orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <>
      <PageHeader title="Audit log" description="Append-only record of sensitive actions (latest 200)." />
      <DataTable head={["When", "Actor", "Action", "Entity", "Details"]}>
        {logs.map((l) => (
          <tr key={l.id}>
            <td className="text-xs whitespace-nowrap text-fog">{formatDateTime(l.createdAt)}</td>
            <td className="text-xs text-mist">{l.actor?.email ?? "system"}</td>
            <td className="font-mono text-xs text-gold-200">{l.action}</td>
            <td className="text-xs text-fog">{l.entityType}{l.entityId ? ` · ${l.entityId.slice(-8)}` : ""}</td>
            <td className="max-w-xs truncate font-mono text-[11px] text-fog">{l.metadata ? JSON.stringify(l.metadata) : ""}{l.ip ? ` · ${l.ip}` : ""}</td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
