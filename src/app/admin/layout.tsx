import type { Metadata } from "next";
import { DashboardShell, type NavGroup } from "@/components/dashboard/shell";
import { requirePageUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · SWAPDO" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser({ roles: ["ADMIN"], next: "/admin" });
  const [sellers, listings, refunds, fraud, tickets, payouts] = await Promise.all([
    db.seller.count({ where: { status: "PENDING" } }),
    db.service.count({ where: { status: "PENDING_REVIEW" } }),
    db.refund.count({ where: { status: "REQUESTED" } }),
    db.fraudFlag.count({ where: { status: "OPEN" } }),
    db.supportTicket.count({ where: { status: "OPEN" } }),
    db.payout.count({ where: { status: "REQUESTED" } }),
  ]);
  const groups: NavGroup[] = [
    { items: [{ href: "/admin", label: "Overview", icon: "chart", exact: true }] },
    { title: "Marketplace", items: [{ href: "/admin/sellers", label: "Sellers", icon: "store", badge: sellers }, { href: "/admin/listings", label: "Listings", icon: "checks", badge: listings }, { href: "/admin/categories", label: "Categories", icon: "layers" }, { href: "/admin/rentals", label: "Rentals", icon: "timer" }] },
    { title: "Commerce", items: [{ href: "/admin/payments", label: "Payments & refunds", icon: "card", badge: refunds + payouts }, { href: "/admin/subscriptions", label: "Subscriptions", icon: "crown" }, { href: "/admin/promos", label: "Promo codes", icon: "tag" }] },
    { title: "Trust", items: [{ href: "/admin/users", label: "Users", icon: "users" }, { href: "/admin/fraud", label: "Fraud monitoring", icon: "flag", badge: fraud }, { href: "/admin/support", label: "Support tickets", icon: "inbox", badge: tickets }, { href: "/admin/audit", label: "Audit log", icon: "scroll" }] },
    { title: "Platform", items: [{ href: "/admin/settings", label: "Settings & pricing", icon: "sliders" }] },
  ];
  return <DashboardShell area="Admin console" groups={groups} user={user}>{children}</DashboardShell>;
}
