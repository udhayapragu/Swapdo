import type { Metadata } from "next";
import { DashboardShell, type NavGroup } from "@/components/dashboard/shell";
import { requireSellerPage } from "@/lib/seller-context";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: { default: "Seller studio", template: "%s · Seller studio · SWAPDO" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const { user, seller } = await requireSellerPage();
  const openTickets = await db.supportTicket.count({ where: { sellerId: seller.id, status: { not: "RESOLVED" } } });
  const groups: NavGroup[] = [
    { items: [{ href: "/seller", label: "Overview", icon: "dashboard", exact: true }, { href: "/seller/listings", label: "Listings", icon: "layers" }, { href: "/seller/orders", label: "Orders", icon: "bag" }, { href: "/seller/payouts", label: "Earnings & payouts", icon: "wallet" }, { href: "/seller/support", label: "Customer support", icon: "inbox", badge: openTickets }] },
    { title: "Account", items: [{ href: "/dashboard", label: "Customer dashboard", icon: "timer" }, ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Admin", icon: "shield" }] : [])] },
  ];
  return <DashboardShell area={seller.displayName} groups={groups} user={user}>{children}</DashboardShell>;
}
