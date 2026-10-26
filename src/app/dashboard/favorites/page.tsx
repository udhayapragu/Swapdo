import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth/session";
import { getAvailability, serviceCardInclude } from "@/lib/catalog";
import { PageHeader } from "@/components/dashboard/shell";
import { ServiceCard } from "@/components/marketplace/service-card";
import { EmptyState, Panel } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Wishlist" };

export default async function FavoritesPage() {
  const user = await requirePageUser();
  const favs = await db.favorite.findMany({ where: { userId: user.id, service: { status: "APPROVED" } }, include: { service: { include: serviceCardInclude } }, orderBy: { createdAt: "desc" } });
  const availability = await getAvailability(favs.map((f) => f.service));
  return (
    <>
      <PageHeader title="Wishlist" description="Services you’ve saved for later." />
      {favs.length === 0 ? (
        <Panel><EmptyState icon={<Heart className="h-5 w-5" />} title="Your wishlist is empty" body="Tap the heart on any service to save it here." action={<ButtonLink href="/marketplace" size="sm">Explore</ButtonLink>} /></Panel>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{favs.map((f) => <ServiceCard key={f.serviceId} service={f.service} favorite availability={availability.get(f.serviceId)} />)}</div>
      )}
    </>
  );
}
