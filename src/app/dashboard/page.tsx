import Link from "next/link";
import { ArrowRight, Coins, Crown, Heart, Receipt, Timer } from "lucide-react";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { getEntitlements } from "@/lib/subscriptions/entitlements";
import { creditBalance } from "@/lib/credits";
import { formatMoney } from "@/lib/money";
import { relativeTime } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/shell";
import { RentalCard } from "@/components/dashboard/rental-card";
import { EmptyState, Panel, PanelHeader, StatCard } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { ServiceArt } from "@/components/ui/service-art";
import { Badge } from "@/components/ui/badge";

export default async function DashboardOverview({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requirePageUser();
  const { denied } = await searchParams;
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const weekAgo = new Date(now.getTime() - 6 * 86400000);
  weekAgo.setUTCHours(0, 0, 0, 0);

  const [ent, credits, live, spend, usage, recentOrders, favorites, notifications] = await Promise.all([
    getEntitlements(user.id, now),
    creditBalance(user.id),
    db.rental.findMany({
      where: { userId: user.id, OR: [{ status: "ACTIVE", endsAt: { gt: now } }, { status: "PENDING_PAYMENT" }] },
      include: { service: { select: { name: true, slug: true, accent: true, icon: true } }, plan: { select: { usageUnit: true } } },
      orderBy: { endsAt: "asc" },
    }),
    db.order.aggregate({ where: { userId: user.id, status: "PAID", paidAt: { gte: monthStart } }, _sum: { totalMinor: true } }),
    db.usageRecord.findMany({ where: { userId: user.id, createdAt: { gte: weekAgo } }, select: { units: true, createdAt: true } }),
    db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.favorite.findMany({ where: { userId: user.id }, include: { service: { select: { name: true, slug: true, accent: true, icon: true, tagline: true } } }, take: 4, orderBy: { createdAt: "desc" } }),
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 4 }),
  ]);

  const active = live.filter((r) => r.status === "ACTIVE");
  const pending = live.filter((r) => r.status === "PENDING_PAYMENT");
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekAgo.getTime() + i * 86400000);
    const units = usage.filter((u) => u.createdAt >= d && u.createdAt < new Date(d.getTime() + 86400000)).reduce((a, u) => a + u.units, 0);
    return { label: d.toLocaleDateString("en-IN", { weekday: "short" }), units };
  });
  const maxUnits = Math.max(1, ...days.map((d) => d.units));
  const hour = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(now));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      {denied && <div role="alert" className="mb-6 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">You don’t have access to that area.</div>}
      <PageHeader eyebrow="Control center" title={`${greeting}, ${user.name.split(" ")[0]}.`} description="Your rentals, membership and activity at a glance." action={<ButtonLink href="/marketplace" size="sm">Rent something new <ArrowRight className="h-4 w-4" /></ButtonLink>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Active rentals" value={active.length} hint={`${ent.plan.maxConcurrentRentals} allowed on ${ent.plan.name}`} icon={<Timer className="h-4 w-4" />} />
        <StatCard label="Credits" value={credits.toLocaleString("en-IN")} hint="1 credit = ₹1" icon={<Coins className="h-4 w-4" />} />
        <StatCard label="Membership" value={ent.plan.name} hint={ent.inGrace ? <span className="text-warning">Payment past due</span> : ent.paid ? `${ent.plan.rentalDiscountBps / 100}% off rentals` : "Upgrade to save"} icon={<Crown className="h-4 w-4" />} />
        <StatCard label="Spent this month" value={formatMoney(spend._sum.totalMinor ?? 0)} hint="Across rentals & membership" icon={<Receipt className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <section aria-labelledby="active-rentals">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="active-rentals" className="text-[15px] font-semibold text-ivory">Active rentals</h2>
              <Link href="/dashboard/rentals" className="text-xs text-gold-300 hover:text-gold-200">View all</Link>
            </div>
            {active.length === 0 ? (
              <Panel><EmptyState icon={<Timer className="h-5 w-5" />} title="No active rentals" body="Find a tool for your next project — access starts the moment you pay." action={<ButtonLink href="/marketplace" size="sm">Explore marketplace</ButtonLink>} /></Panel>
            ) : (
              <div className="space-y-3">{active.map((r) => <RentalCard key={r.id} rental={r} now={now} />)}</div>
            )}
            {pending.length > 0 && (
              <div className="mt-3 space-y-3">
                {pending.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning/25 bg-warning/[0.05] px-4 py-3 text-sm">
                    <span className="text-mist"><span className="text-ivory">{r.service.name}</span> is awaiting payment.</span>
                    <Link href={`/dashboard/rentals/${r.id}`} className="font-medium text-warning hover:underline">Complete or cancel</Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          <Panel>
            <PanelHeader title="Usage this week" description="Requests, generations and minutes recorded across your rentals." />
            <div className="flex h-44 items-end gap-2 px-5 pt-6 pb-5 sm:gap-4 sm:px-6">
              {days.map((d, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] text-fog tabular-nums">{d.units || ""}</span>
                  <div className="w-full max-w-10 rounded-t-lg bg-gradient-to-t from-gold-500/40 to-gold-300/90 transition-all" style={{ height: `${Math.max(3, (d.units / maxUnits) * 100)}px` }} title={`${d.units} units`} />
                  <span className="text-[11px] text-fog">{d.label}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Recent activity" action={<Link href="/dashboard/billing" className="text-xs text-gold-300">Billing</Link>} />
            <ul className="divide-y divide-white/[0.05] px-5 py-2 sm:px-6">
              {recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-ivory">{o.description}</p>
                    <p className="text-xs text-fog">{relativeTime(o.createdAt)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-ivory tabular-nums">{formatMoney(o.totalMinor)}</p>
                    <Badge tone={o.status === "PAID" ? "success" : o.status === "FAILED" ? "danger" : o.status === "PENDING" ? "warning" : "neutral"}>{o.status.toLowerCase()}</Badge>
                  </div>
                </li>
              ))}
              {recentOrders.length === 0 && <li className="py-6 text-center text-sm text-fog">No orders yet.</li>}
            </ul>
          </Panel>

          <Panel>
            <PanelHeader title="Notifications" action={<Link href="/dashboard/notifications" className="text-xs text-gold-300">All</Link>} />
            <ul className="space-y-1 px-3 py-3">
              {notifications.map((n) => (
                <li key={n.id}>
                  <Link href={n.href ?? "/dashboard/notifications"} className="flex gap-3 rounded-xl px-2 py-2.5 hover:bg-white/[0.03]">
                    <span className={n.readAt ? "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-transparent" : "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400"} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-ivory">{n.title}</span>
                      <span className="block truncate text-xs text-fog">{n.body}</span>
                    </span>
                  </Link>
                </li>
              ))}
              {notifications.length === 0 && <li className="py-6 text-center text-sm text-fog">You’re all caught up.</li>}
            </ul>
          </Panel>

          <Panel>
            <PanelHeader title="Wishlist" action={<Link href="/dashboard/favorites" className="text-xs text-gold-300">All</Link>} />
            <ul className="grid grid-cols-2 gap-3 p-5 sm:p-6">
              {favorites.map((f) => (
                <li key={f.serviceId}>
                  <Link href={`/marketplace/${f.service.slug}`} className="group block">
                    <ServiceArt seed={f.service.slug} accent={f.service.accent} icon={f.service.icon} size="sm" className="aspect-[4/3] rounded-xl" />
                    <p className="mt-2 truncate text-xs text-mist group-hover:text-ivory">{f.service.name}</p>
                  </Link>
                </li>
              ))}
              {favorites.length === 0 && <li className="col-span-2 flex flex-col items-center py-4 text-center text-sm text-fog"><Heart className="mb-2 h-4 w-4" />Save services to compare later.</li>}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
