import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireSellerPage } from "@/lib/seller-context";
import { getPlatformSettings } from "@/lib/settings";
import { PageHeader } from "@/components/dashboard/shell";
import { DataTable } from "@/components/dashboard/data-table";
import { PayoutButton } from "@/components/seller/payout-button";
import { Panel, StatCard } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-pill";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Earnings & payouts" };

export default async function PayoutsPage() {
  const { seller } = await requireSellerPage();
  const [settings, available, pending, lifetime, payouts] = await Promise.all([
    getPlatformSettings(),
    db.commission.aggregate({ where: { sellerId: seller.id, status: "AVAILABLE", payoutId: null }, _sum: { netMinor: true } }),
    db.payout.aggregate({ where: { sellerId: seller.id, status: { in: ["REQUESTED", "APPROVED"] } }, _sum: { amountMinor: true } }),
    db.commission.aggregate({ where: { sellerId: seller.id, status: { not: "REVERSED" } }, _sum: { netMinor: true, commissionMinor: true } }),
    db.payout.findMany({ where: { sellerId: seller.id }, orderBy: { createdAt: "desc" } }),
  ]);
  const avail = available._sum.netMinor ?? 0;
  return (
    <>
      <PageHeader title="Earnings & payouts" description={`Payouts are available from ${formatMoney(settings.minimumPayoutMinor)}. Bank transfers are not executed in this sandbox build.`} action={<PayoutButton disabled={avail < settings.minimumPayoutMinor} />} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Available" value={formatMoney(avail)} />
        <StatCard label="In transit" value={formatMoney(pending._sum.amountMinor ?? 0)} />
        <StatCard label="Lifetime net" value={formatMoney(lifetime._sum.netMinor ?? 0)} />
        <StatCard label="Commission paid" value={formatMoney(lifetime._sum.commissionMinor ?? 0)} />
      </div>
      <h2 className="mt-10 mb-3 text-[15px] font-semibold text-ivory">Payout history</h2>
      {payouts.length === 0 ? <Panel className="p-8 text-center text-sm text-fog">No payouts yet.</Panel> : (
        <DataTable head={["Requested", "Amount", "Status", "Processed", "Notes"]}>
          {payouts.map((p) => (
            <tr key={p.id}>
              <td className="text-fog">{formatDateTime(p.createdAt)}</td>
              <td className="font-medium text-ivory tabular-nums">{formatMoney(p.amountMinor, true)}</td>
              <td><StatusBadge status={p.status} /></td>
              <td className="text-fog">{p.processedAt ? formatDateTime(p.processedAt) : "—"}</td>
              <td className="text-xs text-fog">{p.notes ?? ""}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </>
  );
}
