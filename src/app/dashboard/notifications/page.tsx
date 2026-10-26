import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "lucide-react";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/dashboard/shell";
import { MarkReadButton } from "@/components/dashboard/mark-read-button";
import { EmptyState, Panel } from "@/components/ui/card";
import { relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requirePageUser();
  const items = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <>
      <PageHeader title="Notifications" action={items.some((n) => !n.readAt) ? <MarkReadButton /> : undefined} />
      <Panel>
        {items.length === 0 ? <EmptyState icon={<Bell className="h-5 w-5" />} title="No notifications" /> : (
          <ul className="divide-y divide-white/[0.05]">
            {items.map((n) => (
              <li key={n.id}>
                <Link href={n.href ?? "#"} className="flex gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02] sm:px-6">
                  <span className={n.readAt ? "mt-2 h-2 w-2 shrink-0 rounded-full bg-white/10" : "mt-2 h-2 w-2 shrink-0 rounded-full bg-gold-400 shadow-[0_0_10px] shadow-gold-400/60"} aria-label={n.readAt ? "Read" : "Unread"} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ivory">{n.title}</span>
                    <span className="mt-0.5 block text-sm text-fog">{n.body}</span>
                  </span>
                  <span className="shrink-0 text-xs text-smoke">{relativeTime(n.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
