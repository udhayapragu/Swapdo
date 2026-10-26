import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { effectiveStatus } from "@/lib/rentals/engine";
import { PageHeader } from "@/components/dashboard/shell";
import { DataTable } from "@/components/dashboard/data-table";
import { ActionButton } from "@/components/admin/action-button";
import { RentalStatusPill } from "@/components/ui/status-pill";
import { Countdown } from "@/components/ui/countdown";
import { durationLabel } from "@/config/durations";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Rentals" };

export default async function AdminRentalsPage() {
  await requirePageUser({ roles: ["ADMIN"] });
  const now = new Date();
  const rentals = await db.rental.findMany({ include: { user: { select: { email: true } }, service: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 150 });
  return (
    <>
      <PageHeader title="Rentals" description="All rentals with server-authoritative status. Force-ending is logged and the customer is notified." />
      <DataTable head={["Service", "Customer", "Duration", "Window", "Remaining", "Usage", "Status", ""]}>
        {rentals.map((r) => {
          const st = effectiveStatus(r, now);
          const live = st === "ACTIVE" || st === "EXPIRING_SOON";
          return (
            <tr key={r.id}>
              <td className="text-ivory">{r.service.name}</td>
              <td className="text-xs text-fog">{r.user.email}</td>
              <td className="text-mist">{durationLabel(r.durationMinutes)}</td>
              <td className="text-xs whitespace-nowrap text-fog">{r.startsAt ? `${formatDateTime(r.startsAt)} →` : "—"}<br />{r.endsAt ? formatDateTime(r.endsAt) : ""}</td>
              <td>{live && r.endsAt ? <Countdown endsAt={r.endsAt.toISOString()} serverNow={now.toISOString()} refreshOnEnd={false} className="text-xs text-gold-200" /> : <span className="text-fog">—</span>}</td>
              <td className="text-xs tabular-nums">{r.usageCount}{r.usageLimit !== null ? `/${r.usageLimit}` : ""}</td>
              <td><RentalStatusPill status={st} /></td>
              <td className="text-right">{live && <ActionButton endpoint={`/api/admin/rentals/${r.id}`} method="DELETE" label="Force end" variant="danger" confirm="End this rental immediately? Refunds are handled separately." success="Rental ended" />}</td>
            </tr>
          );
        })}
      </DataTable>
    </>
  );
}
