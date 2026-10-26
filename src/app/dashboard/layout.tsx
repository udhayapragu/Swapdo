import type { Metadata } from "next";
import { DashboardShell, type NavGroup } from "@/components/dashboard/shell";
import { requirePageUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s · Dashboard · SWAPDO" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser({ next: "/dashboard" });
  const unread = await db.notification.count({ where: { userId: user.id, readAt: null } });
  const groups: NavGroup[] = [
    { items: [{ href: "/dashboard", label: "Overview", icon: "dashboard", exact: true }, { href: "/dashboard/rentals", label: "Rentals", icon: "timer" }, { href: "/dashboard/subscription", label: "Membership", icon: "crown" }, { href: "/dashboard/billing", label: "Billing", icon: "card" }] },
    { title: "You", items: [{ href: "/dashboard/favorites", label: "Wishlist", icon: "heart" }, { href: "/dashboard/notifications", label: "Notifications", icon: "bell", badge: unread }, { href: "/dashboard/settings", label: "Settings", icon: "settings" }, { href: "/dashboard/support", label: "Support", icon: "support" }] },
  ];
  if (user.sellerId || user.role === "ADMIN") {
    groups.push({ title: "Workspaces", items: [...(user.sellerId ? [{ href: "/seller", label: "Seller studio", icon: "store" }] : []), ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Admin", icon: "shield" }] : [])] });
  }
  return <DashboardShell area="Control center" groups={groups} user={user}>{children}</DashboardShell>;
}
