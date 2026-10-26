import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { SearchX, Sparkles } from "lucide-react";
import { AdvancedFilters, MarketplaceFilters } from "@/components/marketplace/filters";
import { ServiceCard } from "@/components/marketplace/service-card";
import { EmptyState } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { ServiceArt } from "@/components/ui/service-art";
import { Stagger, StaggerItem } from "@/components/ui/reveal";
import { getAvailability, getCategories, getFavoriteIds, parseMarketplaceQuery, searchServices } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Marketplace",
  description: "Browse authorized AI tools, licensed entertainment and creator services available by the hour, week, month or year.",
  alternates: { canonical: "/marketplace" },
};

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const query = parseMarketplaceQuery(sp);
  const user = await getCurrentUser();
  const [services, categories, favorites, recent] = await Promise.all([
    searchServices(query),
    getCategories(),
    getFavoriteIds(user?.id),
    user
      ? db.recentView.findMany({ where: { userId: user.id, service: { status: "APPROVED" } }, orderBy: { viewedAt: "desc" }, take: 4, include: { service: { select: { slug: true, name: true, accent: true, icon: true, tagline: true } } } })
      : Promise.resolve([]),
  ]);
  const availability = await getAvailability(services);
  const activeCategory = categories.find((c) => c.slug === query.category);
  const filtered = Object.values(sp).some((v) => v !== undefined && v !== "");

  return (
    <div className="container-page pt-24 lg:pt-28">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.24em] text-gold-300/90 uppercase">Marketplace</p>
        <h1 className="mt-3 text-4xl font-semibold text-ivory sm:text-5xl">
          {activeCategory ? activeCategory.name : <>Rent the <span className="font-display font-normal italic text-gold">extraordinary.</span></>}
        </h1>
        <p className="mt-3 text-mist">{activeCategory ? activeCategory.tagline : "Authorized tools and services, available for exactly as long as you need them."}</p>
      </header>

      <div className="mt-8">
        <Suspense fallback={<div className="skeleton h-28 rounded-2xl" />}>
          <MarketplaceFilters categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} total={services.length} />
        </Suspense>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-[200px] space-y-6">
            <div className="glass rounded-2xl p-5">
              <h2 className="mb-4 text-sm font-semibold text-ivory">Refine</h2>
              <Suspense>
                <AdvancedFilters />
              </Suspense>
            </div>
            {recent.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <h2 className="mb-3 text-sm font-semibold text-ivory">Recently viewed</h2>
                <ul className="space-y-3">
                  {recent.map((r) => (
                    <li key={r.serviceId}>
                      <Link href={`/marketplace/${r.service.slug}`} className="group flex items-center gap-3">
                        <ServiceArt seed={r.service.slug} accent={r.service.accent} icon={r.service.icon} size="sm" className="h-11 w-11 shrink-0 rounded-xl" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-ivory group-hover:text-gold-200">{r.service.name}</span>
                          <span className="block truncate text-xs text-fog">{r.service.tagline}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>

        <section aria-label="Results">
          {services.length === 0 && !filtered ? (
            <div className="glass rounded-2xl">
              <EmptyState icon={<Sparkles className="h-5 w-5" />} title="New listings are on their way" body="We’re onboarding our first authorized providers. Check back soon, or list your own service." action={<ButtonLink href="/sell" variant="outline" size="sm">Become a seller</ButtonLink>} />
            </div>
          ) : services.length === 0 ? (
            <div className="glass rounded-2xl">
              <EmptyState icon={<SearchX className="h-5 w-5" />} title="No services match those filters" body="Try a different search term, widen the price range or browse all categories." action={<ButtonLink href="/marketplace" variant="outline" size="sm">Reset filters</ButtonLink>} />
            </div>
          ) : (
            <Stagger key={JSON.stringify(sp)} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {services.map((s) => (
                <StaggerItem key={s.id}>
                  <ServiceCard service={s} favorite={favorites.has(s.id)} availability={availability.get(s.id)} />
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </section>
      </div>
    </div>
  );
}
