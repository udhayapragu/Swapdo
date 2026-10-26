import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Globe, Star } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getAvailability, getFavoriteIds, serviceCardInclude } from "@/lib/catalog";
import { ServiceCard } from "@/components/marketplace/service-card";
import { VerifiedBadge } from "@/components/ui/badge";
import { LogoMark } from "@/components/ui/logo";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = await db.seller.findFirst({ where: { slug, status: "APPROVED" }, select: { displayName: true, bio: true } });
  return s ? { title: s.displayName, description: s.bio } : { title: "Provider not found" };
}

export default async function ProviderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const seller = await db.seller.findFirst({
    where: { slug, status: "APPROVED" },
    include: { services: { where: { status: "APPROVED" }, include: serviceCardInclude, orderBy: { popularity: "desc" } }, authorizations: { where: { status: "APPROVED" }, select: { kind: true, title: true } } },
  });
  if (!seller) notFound();
  const user = await getCurrentUser();
  const [favorites, availability] = await Promise.all([getFavoriteIds(user?.id), getAvailability(seller.services)]);
  const reviews = seller.services.reduce((a, s) => a + s.ratingCount, 0);
  const avg = reviews ? seller.services.reduce((a, s) => a + s.ratingAvg * s.ratingCount, 0) / reviews : 0;

  return (
    <div className="container-page pt-28 lg:pt-36">
      <header className="glass relative overflow-hidden rounded-3xl p-6 sm:p-10">
        <div className="pointer-events-none absolute -top-20 -right-20 opacity-[0.06]" aria-hidden><LogoMark className="h-80 w-80" /></div>
        <div className="flex flex-wrap items-center gap-2">
          {seller.verified && <VerifiedBadge />}
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-ivory sm:text-4xl">{seller.displayName}</h1>
        <p className="mt-3 max-w-2xl text-mist">{seller.bio}</p>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-fog">
          <span>{seller.services.length} services</span>
          {reviews > 0 && <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-gold-400 text-gold-400" /> {avg.toFixed(1)} ({reviews} reviews)</span>}
          <span>On SWAPDO since {formatDate(seller.createdAt, { month: "long", year: "numeric" })}</span>
          {seller.website && <span className="flex items-center gap-1"><Globe className="h-4 w-4" /> {seller.website.replace(/^https?:\/\//, "")}</span>}
        </div>
        {seller.authorizations.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {seller.authorizations.map((a) => <li key={a.title} className="rounded-full border border-gold-400/20 bg-gold-400/5 px-3 py-1 text-xs text-gold-200">{a.title}</li>)}
          </ul>
        )}
      </header>
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-ivory">Services</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {seller.services.map((s) => <ServiceCard key={s.id} service={s} favorite={favorites.has(s.id)} availability={availability.get(s.id)} />)}
        </div>
      </section>
    </div>
  );
}
