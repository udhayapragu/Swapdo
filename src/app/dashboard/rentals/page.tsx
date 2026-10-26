import type { Metadata } from "next";
import Link from "next/link";
import { History, Timer } from "lucide-react";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { effectiveStatus } from "@/lib/rentals/engine";
import { PageHeader } from "@/components/dashboard/shell";
import { RentalCard } from "@/components/dashboard/rental-card";
import { EmptyState, Panel } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Rentals" };

const TABS = [
  { key: "active", label: "Active" },
  { key: "pending", label: "Awaiting payment" },
  { key: "history", label: "History" },
] as const;

export default async function RentalsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requirePageUser();
  const { tab = "active" } = await searchParams;
  const now = new Date();
  const rentals = await db.rental.findMany({
    where: { userId: user.id },
    include: { service: { select: { name: true, slug: true, accent: true, icon: true } }, plan: { select: { usageUnit: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const groups = {
    active: rentals.filter((r) => ["ACTIVE", "EXPIRING_SOON"].includes(effectiveStatus(r, now))),
    pending: rentals.filter((r) => r.status === "PENDING_PAYMENT"),
    history: rentals.filter((r) => ["EXPIRED", "CANCELLED", "REFUNDED"].includes(effectiveStatus(r, now))),
  };
  const current = groups[(tab in groups ? tab : "active") as keyof typeof groups];

  return (
    <>
      <PageHeader title="Rentals" description="Every rental is timed by SWAPDO’s servers and ends automatically." action={<ButtonLink href="/marketplace" size="sm">New rental</ButtonLink>} />
      <div className="mb-5 flex gap-2 overflow-x-auto scrollbar-none" role="tablist">
        {TABS.map((t) => (
          <Link key={t.key} href={`/dashboard/rentals?tab=${t.key}`} role="tab" aria-selected={tab === t.key} className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors", tab === t.key ? "bg-white/[0.08] text-ivory" : "text-fog hover:text-ivory")}>
            {t.label} <span className="ml-1 text-fog tabular-nums">{groups[t.key].length}</span>
          </Link>
        ))}
      </div>
      {current.length === 0 ? (
        <Panel><EmptyState icon={tab === "history" ? <History className="h-5 w-5" /> : <Timer className="h-5 w-5" />} title={tab === "history" ? "No rental history yet" : tab === "pending" ? "Nothing awaiting payment" : "No active rentals"} action={<ButtonLink href="/marketplace" size="sm" variant="outline">Browse services</ButtonLink>} /></Panel>
      ) : (
        <div className="space-y-3">{current.map((r) => <RentalCard key={r.id} rental={r} now={now} />)}</div>
      )}
    </>
  );
}
