import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireSellerPage } from "@/lib/seller-context";
import { PageHeader } from "@/components/dashboard/shell";
import { DataTable } from "@/components/dashboard/data-table";
import { StatusBadge } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders" };

export default async function SellerOrdersPage() {
  const { seller } = await requireSellerPage();
  const rows = await db.commission.findMany({
    where: { sellerId: seller.id },
    include: { order: { select: { number: true, description: true, status: true, user: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <>
      <PageHeader title="Orders" description="Each paid rental of your services, with the platform commission applied." />
      <DataTable head={["Order", "Item", "Customer", "Date", "Gross", "Commission", "Net", "Status"]} empty={rows.length === 0 ? <EmptyState title="No orders yet" /> : undefined}>
        {rows.map((c) => (
          <tr key={c.id}>
            <td className="font-mono text-xs text-fog">{c.order.number}</td>
            <td className="max-w-56 truncate text-ivory">{c.order.description}</td>
            {/* Only first names are shared with providers. */}
            <td className="text-mist">{c.order.user.name.split(" ")[0]}</td>
            <td className="whitespace-nowrap text-fog">{formatDateTime(c.createdAt)}</td>
            <td className="tabular-nums">{formatMoney(c.grossMinor, true)}</td>
            <td className="text-fog tabular-nums">−{formatMoney(c.commissionMinor, true)} <span className="text-[11px]">({c.rateBps / 100}%)</span></td>
            <td className="font-medium text-ivory tabular-nums">{formatMoney(c.netMinor, true)}</td>
            <td><StatusBadge status={c.order.status === "REFUNDED" ? "REFUNDED" : c.status} /></td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
