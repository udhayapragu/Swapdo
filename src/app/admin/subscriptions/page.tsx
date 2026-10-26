import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/shell";
import { DataTable } from "@/components/dashboard/data-table";
import { ActionButton } from "@/components/admin/action-button";
import { StatCard } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-pill";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Subscriptions" };

export default async function AdminSubscriptionsPage() {
  await requirePageUser({ roles: ["ADMIN"] });
  const subs = await db.subscription.findMany({ include: { user: { select: { email: true } }, plan: true, scheduledPlan: { select: { name: true } } }, orderBy: { updatedAt: "desc" } });
  const paid = subs.filter((s) => s.plan.code !== "FREE" && s.status !== "EXPIRED");
  const mrr = paid.reduce((a, s) => a + (s.interval === "ANNUAL" ? Math.round(s.plan.annualPriceMinor / 12) : s.plan.monthlyPriceMinor), 0);
  return (
    <>
      <PageHeader title="Subscriptions" description="Membership status, renewals and grace periods." action={<ActionButton endpoint="/api/admin/billing" label="Run billing cycle" variant="outline" success="Billing cycle completed" />} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="MRR (sandbox)" value={formatMoney(mrr)} />
        <StatCard label="Paying members" value={paid.length} />
        <StatCard label="Past due" value={subs.filter((s) => s.status === "PAST_DUE").length} />
        <StatCard label="Cancelling" value={subs.filter((s) => s.cancelAtPeriodEnd).length} />
      </div>
      <DataTable head={["Member", "Plan", "Interval", "Status", "Period end", "Notes"]}>
        {subs.map((s) => (
          <tr key={s.id}>
            <td className="text-xs text-mist">{s.user.email}</td>
            <td className="text-ivory">{s.plan.name}</td>
            <td className="text-fog">{s.plan.code === "FREE" ? "—" : s.interval.toLowerCase()}</td>
            <td><StatusBadge status={s.status} /></td>
            <td className="text-fog">{s.currentPeriodEnd ? formatDate(s.currentPeriodEnd) : "—"}</td>
            <td className="text-xs text-fog">{s.cancelAtPeriodEnd ? "Cancels at period end" : s.scheduledPlan ? `Switching to ${s.scheduledPlan.name}` : s.graceUntil ? `Grace until ${formatDate(s.graceUntil)}` : ""}{s.simulateRenewalFailure ? " · sandbox failure on" : ""}</td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
