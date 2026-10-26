import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/shell";
import { DataTable } from "@/components/dashboard/data-table";
import { StatusBadge } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const user = await requirePageUser();
  const orders = await db.order.findMany({ where: { userId: user.id }, include: { refunds: true, payments: { orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <>
      <PageHeader title="Billing" description="Orders, invoices and refunds. Payments in this build are sandbox transactions." />
      <DataTable head={["Order", "Description", "Date", "Total", "Status", ""]} empty={orders.length === 0 ? <EmptyState title="No orders yet" /> : undefined}>
        {orders.map((o) => {
          const refund = o.refunds[0];
          return (
            <tr key={o.id}>
              <td className="font-mono text-xs text-fog">{o.number}</td>
              <td className="max-w-xs truncate text-ivory">{o.description}{o.payments[0]?.failureReason && <span className="block text-xs text-danger">{o.payments[0].failureReason}</span>}</td>
              <td className="whitespace-nowrap text-fog">{formatDateTime(o.createdAt)}</td>
              <td className="text-ivory tabular-nums">{formatMoney(o.totalMinor, true)}</td>
              <td><div className="flex flex-wrap gap-1"><StatusBadge status={o.status} />{refund && <StatusBadge status={refund.status === "REQUESTED" ? "PENDING" : refund.status} />}</div></td>
              <td className="text-right whitespace-nowrap">
                {o.status === "PAID" || o.status === "REFUNDED" ? <Link href={`/dashboard/billing/${o.id}`} className="text-xs text-gold-300 hover:text-gold-200">Invoice</Link> : o.status === "PENDING" || o.status === "FAILED" ? <Link href={`/checkout/${o.id}`} className="text-xs text-gold-300">Complete payment</Link> : null}
              </td>
            </tr>
          );
        })}
      </DataTable>
      <p className="mt-4 text-xs text-fog">Need a refund for a rental? Open the rental and choose “Request a refund” (available within the refund window).</p>
    </>
  );
}
