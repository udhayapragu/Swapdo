import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/shell";
import { Panel, PanelHeader } from "@/components/ui/card";
import { TicketForm } from "@/components/dashboard/settings-forms";
import { StatusBadge } from "@/components/ui/status-pill";
import { relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Support" };

export default async function SupportPage() {
  const user = await requirePageUser();
  const tickets = await db.supportTicket.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHeader title="Support center" description="We usually reply within a few hours." />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Panel>
          <PanelHeader title="New ticket" description={undefined} action={<Link href="/help" className="text-xs text-gold-300">Help center</Link>} />
          <div className="p-5 sm:p-6"><TicketForm /></div>
        </Panel>
        <Panel>
          <PanelHeader title="Your tickets" />
          <ul className="divide-y divide-white/[0.05] px-5 py-2 sm:px-6">
            {tickets.map((t) => (
              <li key={t.id} className="py-3">
                <div className="flex items-center justify-between gap-2"><span className="truncate text-sm text-ivory">{t.subject}</span><StatusBadge status={t.status} /></div>
                <p className="mt-1 line-clamp-2 text-xs text-fog">{t.body}</p>
                <p className="mt-1 text-[11px] text-smoke">{relativeTime(t.createdAt)}</p>
              </li>
            ))}
            {tickets.length === 0 && <li className="py-8 text-center text-sm text-fog">No tickets yet.</li>}
          </ul>
        </Panel>
      </div>
    </>
  );
}
