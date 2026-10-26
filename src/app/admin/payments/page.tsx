import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/shell";
import { DataTable } from "@/components/dashboard/data-table";
import { ActionButton } from "@/components/admin/action-button";
import { StatusBadge } from "@/components/ui/status-pill";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Payments & refunds" };

export default async function AdminPaymentsPage() {
  await requirePageUser({ roles: ["ADMIN"] });
  const [refunds, payouts, payments, webhooks] = await Promise.all([
    db.refund.findMany({ where: { status: "REQUESTED" }, include: { order: { select: { number: true, description: true, totalMinor: true } }, requestedBy: { select: { email: true } } }, orderBy: { createdAt: "asc" } }),
    db.payout.findMany({ where: { status: { in: ["REQUESTED", "APPROVED"] } }, include: { seller: { select: { displayName: true } } }, orderBy: { createdAt: "asc" } }),
    db.payment.findMany({ include: { order: { select: { number: true, description: true, user: { select: { email: true } } } } }, orderBy: { createdAt: "desc" }, take: 60 }),
    db.webhookEvent.count(),
  ]);
  return (
    <>
      <PageHeader title="Payments & refunds" description={`Provider events processed: ${webhooks} (duplicates are ignored by event id).`} />

      <h2 className="mb-3 text-[15px] font-semibold text-ivory">Refund requests <span className="text-fog">({refunds.length})</span></h2>
      {refunds.length === 0 ? <p className="mb-10 text-sm text-fog">No pending refunds.</p> : (
        <DataTable head={["Order", "Customer", "Reason", "Amount", "Requested", ""]} className="mb-10">
          {refunds.map((r) => (
            <tr key={r.id}>
              <td><p className="text-ivory">{r.order.description}</p><p className="font-mono text-[11px] text-fog">{r.order.number}</p></td>
              <td className="text-xs text-fog">{r.requestedBy.email}</td>
              <td className="max-w-xs text-xs text-mist">{r.reason}</td>
              <td className="tabular-nums">{formatMoney(r.amountMinor, true)}</td>
              <td className="text-xs text-fog">{formatDateTime(r.createdAt)}</td>
              <td><div className="flex justify-end gap-1">
                <ActionButton endpoint={`/api/admin/refunds/${r.id}`} body={{ decision: "approve" }} label="Refund" variant="outline" confirm="Refund this order in full? The rental ends and seller commission is reversed." success="Refund processed (sandbox)" />
                <ActionButton endpoint={`/api/admin/refunds/${r.id}`} body={{ decision: "reject" }} label="Reject" withNotes success="Refund rejected" />
              </div></td>
            </tr>
          ))}
        </DataTable>
      )}

      <h2 className="mb-3 text-[15px] font-semibold text-ivory">Payout requests <span className="text-fog">({payouts.length})</span></h2>
      {payouts.length === 0 ? <p className="mb-10 text-sm text-fog">No pending payouts.</p> : (
        <DataTable head={["Seller", "Amount", "Requested", "Status", ""]} className="mb-10">
          {payouts.map((p) => (
            <tr key={p.id}>
              <td className="text-ivory">{p.seller.displayName}</td>
              <td className="tabular-nums">{formatMoney(p.amountMinor, true)}</td>
              <td className="text-xs text-fog">{formatDateTime(p.createdAt)}</td>
              <td><StatusBadge status={p.status} /></td>
              <td><div className="flex justify-end gap-1">
                <ActionButton endpoint={`/api/admin/payouts/${p.id}`} body={{ decision: "pay" }} label="Mark paid" variant="outline" confirm="Mark as paid? (Sandbox — no bank transfer is executed.)" success="Payout marked paid" />
                <ActionButton endpoint={`/api/admin/payouts/${p.id}`} body={{ decision: "reject" }} label="Reject" success="Payout rejected" />
              </div></td>
            </tr>
          ))}
        </DataTable>
      )}

      <h2 className="mb-3 text-[15px] font-semibold text-ivory">Recent payments</h2>
      <DataTable head={["Order", "Customer", "Provider", "Amount", "Created", "Status"]}>
        {payments.map((p) => (
          <tr key={p.id}>
            <td><p className="max-w-60 truncate text-ivory">{p.order.description}</p><p className="font-mono text-[11px] text-fog">{p.providerOrderId}</p></td>
            <td className="text-xs text-fog">{p.order.user.email}</td>
            <td><span className="text-mist">{p.provider}</span> {p.sandbox && <Badge tone="violet">sandbox</Badge>}</td>
            <td className="tabular-nums">{formatMoney(p.amountMinor, true)}</td>
            <td className="text-xs text-fog">{formatDateTime(p.createdAt)}</td>
            <td><StatusBadge status={p.status} />{p.failureReason && <p className="mt-1 text-[11px] text-danger">{p.failureReason}</p>}</td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
