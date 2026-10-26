import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireSellerPage } from "@/lib/seller-context";
import { PageHeader } from "@/components/dashboard/shell";
import { EmptyState, Panel } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-pill";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Customer support" };

export default async function SellerSupportPage() {
  const { seller } = await requireSellerPage();
  const tickets = await db.supportTicket.findMany({ where: { sellerId: seller.id }, include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHeader title="Customer support" description="Tickets customers have raised about your services. SWAPDO support mediates replies." />
      <Panel>
        {tickets.length === 0 ? <EmptyState title="No tickets" body="Nice — nobody needs help right now." /> : (
          <ul className="divide-y divide-white/[0.05]">
            {tickets.map((t) => (
              <li key={t.id} className="px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-ivory">{t.subject}</span>
                  <span className="flex items-center gap-2">{t.priority === "high" && <Badge tone="danger">High priority</Badge>}<StatusBadge status={t.status} /></span>
                </div>
                <p className="mt-1 text-sm text-mist">{t.body}</p>
                <p className="mt-2 text-xs text-fog">{t.user.name.split(" ")[0]} · {relativeTime(t.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
