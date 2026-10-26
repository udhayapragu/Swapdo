import Link from "next/link";
import { Banknote, Crown, Timer, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/shell";
import { Panel, PanelHeader, StatCard } from "@/components/ui/card";
import { ActionButton } from "@/components/admin/action-button";
import { formatMoney } from "@/lib/money";
import { relativeTime } from "@/lib/utils";

export default async function AdminOverview() {
  await requirePageUser({ roles: ["ADMIN"] });
  const now = new Date();
  const since = new Date(now.getTime() - 30 * 86400000);
  const [gmv, commissions, subsRevenue, liveRentals, members, users, newUsers, queues, orders, byCategory] = await Promise.all([
    db.order.aggregate({ where: { status: "PAID", paidAt: { gte: since } }, _sum: { totalMinor: true }, _count: true }),
    db.commission.aggregate({ where: { createdAt: { gte: since }, status: { not: "REVERSED" } }, _sum: { commissionMinor: true } }),
    db.order.aggregate({ where: { status: "PAID", purpose: "SUBSCRIPTION", paidAt: { gte: since } }, _sum: { totalMinor: true } }),
    db.rental.count({ where: { status: "ACTIVE", endsAt: { gt: now } } }),
    db.subscription.count({ where: { status: { in: ["ACTIVE", "PAST_DUE"] }, plan: { code: { not: "FREE" } } } }),
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: since } } }),
    Promise.all([
      db.seller.count({ where: { status: "PENDING" } }),
      db.service.count({ where: { status: "PENDING_REVIEW" } }),
      db.refund.count({ where: { status: "REQUESTED" } }),
      db.payout.count({ where: { status: "REQUESTED" } }),
      db.fraudFlag.count({ where: { status: "OPEN" } }),
      db.subscription.count({ where: { status: "PAST_DUE" } }),
    ]),
    db.order.findMany({ where: { paidAt: { gte: since }, status: "PAID" }, select: { totalMinor: true, paidAt: true } }),
    db.rental.groupBy({ by: ["serviceId"], where: { createdAt: { gte: since }, status: { in: ["ACTIVE", "EXPIRED"] } }, _count: true }),
  ]);
  const services = await db.service.findMany({ where: { id: { in: byCategory.map((b) => b.serviceId) } }, select: { id: true, category: { select: { name: true, accent: true } } } });
  const catTotals = new Map<string, { count: number; accent: string }>();
  for (const b of byCategory) {
    const c = services.find((s) => s.id === b.serviceId)?.category;
    if (!c) continue;
    const prev = catTotals.get(c.name) ?? { count: 0, accent: c.accent };
    catTotals.set(c.name, { count: prev.count + b._count, accent: c.accent });
  }
  const catList = [...catTotals.entries()].sort((a, b) => b[1].count - a[1].count);
  const catMax = Math.max(1, ...catList.map(([, v]) => v.count));
  const days = Array.from({ length: 30 }, (_, i) => {
    const key = new Date(now.getTime() - (29 - i) * 86400000).toISOString().slice(0, 10);
    return { key, total: orders.filter((o) => o.paidAt!.toISOString().slice(0, 10) === key).reduce((a, o) => a + o.totalMinor, 0) };
  });
  const max = Math.max(1, ...days.map((d) => d.total));
  const [pSellers, pListings, pRefunds, pPayouts, pFraud, pastDue] = queues;
  const queueItems = [
    { label: "Seller applications", count: pSellers, href: "/admin/sellers" },
    { label: "Listings to review", count: pListings, href: "/admin/listings" },
    { label: "Refund requests", count: pRefunds, href: "/admin/payments" },
    { label: "Payout requests", count: pPayouts, href: "/admin/payments" },
    { label: "Open fraud flags", count: pFraud, href: "/admin/fraud" },
    { label: "Past-due memberships", count: pastDue, href: "/admin/subscriptions" },
  ];
  const recentAudit = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { actor: { select: { name: true } } } });

  return (
    <>
      <PageHeader eyebrow="Admin console" title="Platform overview" description="Last 30 days. All payment figures are sandbox transactions." action={<ActionButton endpoint="/api/admin/billing" label="Run scheduled jobs" variant="glass" success="Billing cycle and rental expiry ran." />} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="GMV" value={formatMoney(gmv._sum.totalMinor ?? 0)} hint={`${gmv._count} paid orders`} icon={<Banknote className="h-4 w-4" />} />
        <StatCard label="Platform revenue" value={formatMoney((commissions._sum.commissionMinor ?? 0) + (subsRevenue._sum.totalMinor ?? 0))} hint="Commissions + memberships" icon={<Banknote className="h-4 w-4" />} />
        <StatCard label="Live rentals" value={liveRentals} hint="Right now" icon={<Timer className="h-4 w-4" />} />
        <StatCard label="Paying members" value={members} hint={`${users} users · +${newUsers} this month`} icon={<Users className="h-4 w-4" />} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel>
          <PanelHeader title="Daily GMV" />
          <div className="flex h-52 items-end gap-[3px] px-5 pt-6 pb-5 sm:px-6" role="img" aria-label="Daily gross merchandise value, last 30 days">
            {days.map((d) => <div key={d.key} className="flex-1 rounded-t bg-gradient-to-t from-gold-600/50 to-gold-300" style={{ height: `${Math.max(2, (d.total / max) * 170)}px` }} title={`${d.key}: ${formatMoney(d.total)}`} />)}
          </div>
        </Panel>
        <Panel>
          <PanelHeader title="Action queues" />
          <ul className="space-y-1 p-3">
            {queueItems.map((q) => (
              <li key={q.label}>
                <Link href={q.href} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm hover:bg-white/[0.03]">
                  <span className="text-mist">{q.label}</span>
                  <span className={q.count ? "rounded-full bg-gold-400 px-2 text-xs font-bold text-obsidian-950" : "text-xs text-smoke"}>{q.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel>
          <PanelHeader title="Rentals by category" />
          <ul className="space-y-3 p-5 sm:p-6">
            {catList.map(([name, v]) => (
              <li key={name}>
                <div className="flex justify-between text-sm"><span className="text-mist">{name}</span><span className="text-ivory tabular-nums">{v.count}</span></div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full" style={{ width: `${(v.count / catMax) * 100}%`, background: v.accent }} /></div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <PanelHeader title="Recent admin & system activity" action={<Link href="/admin/audit" className="text-xs text-gold-300">Audit log</Link>} />
          <ul className="divide-y divide-white/[0.05] px-5 py-2 text-sm sm:px-6">
            {recentAudit.map((a) => (
              <li key={a.id} className="flex justify-between gap-3 py-2.5"><span className="truncate text-mist"><span className="text-ivory">{a.actor?.name ?? "System"}</span> · {a.action}</span><span className="shrink-0 text-xs text-fog">{relativeTime(a.createdAt)}</span></li>
            ))}
          </ul>
        </Panel>
      </div>
      <p className="mt-6 flex items-center gap-2 text-xs text-fog"><Crown className="h-3.5 w-3.5" /> Scheduled jobs (rental expiry, billing) should run via <code className="text-mist">/api/cron/*</code> with CRON_SECRET in production.</p>
    </>
  );
}
