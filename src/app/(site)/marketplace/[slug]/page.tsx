import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, Check, KeyRound, ShieldCheck, Star } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getEntitlements } from "@/lib/subscriptions/entitlements";
import { creditBalance } from "@/lib/credits";
import { isFeatureEnabled } from "@/lib/settings";
import { getAvailability, getFavoriteIds, serviceCardInclude } from "@/lib/catalog";
import { siteConfig } from "@/config/site";
import { ServiceArt } from "@/components/ui/service-art";
import { VerifiedBadge } from "@/components/ui/badge";
import { RentalPanel } from "@/components/marketplace/rental-panel";
import { FavoriteButton } from "@/components/marketplace/favorite-button";
import { AvailabilityDot, ServiceCard } from "@/components/marketplace/service-card";
import { ReviewForm } from "@/components/marketplace/review-form";
import { Reveal } from "@/components/ui/reveal";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ACCESS_COPY: Record<string, { title: string; body: string }> = {
  OFFICIAL_API: { title: "Official API access", body: "Your rental is provisioned through the provider’s official API. Requests are metered against your plan and stop automatically at expiry." },
  OAUTH: { title: "Delegated sign-in (OAuth)", body: "You connect with the provider’s official sign-in. SWAPDO never sees your password, and access is revoked when your rental ends." },
  PROVIDER_TOKEN: { title: "Provider-issued access token", body: "The provider issues a short-lived token valid only for your rental window, used in their authorised app or player." },
  MANAGED_SERVICE: { title: "Managed service", body: "Delivered by the provider’s team. Where account access is needed, you grant a limited role using the platform’s official tools — never a password." },
  DEMO: { title: "Simulated access", body: "This demo listing simulates access to illustrate the rental flow." },
};

const AUTH_COPY: Record<string, string> = {
  OWN_SERVICE: "Provider owns and operates this service",
  OFFICIAL_API: "Offered through an official API partner programme",
  RESELLER_AGREEMENT: "Offered under an authorised reseller agreement",
  CONTENT_LICENSE: "Distributed under a content licence",
};

async function load(slug: string) {
  return db.service.findFirst({
    where: { slug, status: "APPROVED" },
    include: {
      ...serviceCardInclude,
      seller: { select: { id: true, displayName: true, slug: true, verified: true, bio: true, isDemo: true } },
      authorization: { select: { kind: true, status: true, validUntil: true } },
      reviews: { orderBy: { createdAt: "desc" }, take: 12 },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = await db.service.findFirst({ where: { slug, status: "APPROVED" }, select: { name: true, tagline: true } });
  if (!s) return { title: "Service not found" };
  return { title: s.name, description: s.tagline, alternates: { canonical: `/marketplace/${slug}` }, openGraph: { title: `${s.name} · SWAPDO`, description: s.tagline } };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await load(slug);
  if (!service) notFound();
  const user = await getCurrentUser();
  const now = new Date();

  const [ent, credits, creditsEnabled, favorites, availability, related, rentedCount, ownReview] = await Promise.all([
    user ? getEntitlements(user.id) : null,
    user ? creditBalance(user.id) : 0,
    isFeatureEnabled("credits_at_checkout"),
    getFavoriteIds(user?.id),
    getAvailability([service]),
    db.service.findMany({ where: { status: "APPROVED", categoryId: service.categoryId, id: { not: service.id } }, include: serviceCardInclude, orderBy: { popularity: "desc" }, take: 3 }),
    user ? db.rental.count({ where: { userId: user.id, serviceId: service.id, status: { in: ["ACTIVE", "EXPIRED"] } } }) : 0,
    user ? db.review.findFirst({ where: { userId: user.id, serviceId: service.id } }) : null,
  ]);
  if (user) {
    await db.recentView.upsert({ where: { userId_serviceId: { userId: user.id, serviceId: service.id } }, update: { viewedAt: now }, create: { userId: user.id, serviceId: service.id } });
  }
  const avail = availability.get(service.id);
  const isAvailable = !avail || avail.capacity === null || avail.inUse < avail.capacity;
  const access = ACCESS_COPY[service.accessMethod] ?? ACCESS_COPY.DEMO!;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: service.name,
    description: service.tagline,
    brand: { "@type": "Brand", name: service.seller.displayName },
    offers: service.plans.map((p) => ({ "@type": "Offer", price: (p.priceMinor / 100).toFixed(2), priceCurrency: "INR", availability: isAvailable ? "https://schema.org/InStock" : "https://schema.org/SoldOut" })),
    ...(service.ratingCount > 0 && !service.isDemo ? { aggregateRating: { "@type": "AggregateRating", ratingValue: service.ratingAvg, reviewCount: service.ratingCount } } : {}),
  };

  return (
    <div className="container-page pt-24 lg:pt-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-sm text-fog hover:text-ivory"><ArrowLeft className="h-4 w-4" /> Marketplace</Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="min-w-0">
          <Reveal>
            <ServiceArt seed={service.slug} accent={service.accent} icon={service.icon} size="lg" className="aspect-[21/9] rounded-3xl border hairline" />
          </Reveal>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Link href={`/marketplace?category=${service.category.slug}`} className="text-xs font-semibold tracking-wide uppercase" style={{ color: service.category.accent }}>{service.category.name}</Link>
            <AvailabilityDot availability={avail} />
          </div>
          <div className="mt-3 flex items-start justify-between gap-4">
            <h1 className="text-3xl font-semibold text-ivory sm:text-4xl">{service.name}</h1>
            <FavoriteButton serviceId={service.id} initial={favorites.has(service.id)} withLabel className="shrink-0" />
          </div>
          <p className="mt-3 text-lg text-mist">{service.tagline}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-fog">
            <Link href={`/providers/${service.seller.slug}`} className="hover:text-ivory">by <span className="text-ivory">{service.seller.displayName}</span></Link>
            {service.seller.verified && <VerifiedBadge />}
            {service.ratingCount > 0 && <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-gold-400 text-gold-400" /> {service.ratingAvg.toFixed(1)} · {service.ratingCount} reviews</span>}
          </div>

          <div className="mt-8 lg:hidden">
            <RentalPanel plans={service.plans} signedIn={!!user} memberDiscountBps={ent?.plan.rentalDiscountBps ?? 0} planName={ent?.paid ? ent.plan.name : null} credits={credits} maxCreditShare={siteConfig.maxCreditShare} serverNow={now.toISOString()} available={isAvailable} creditsEnabled={creditsEnabled} />
          </div>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-ivory">About this service</h2>
            <p className="mt-3 leading-relaxed whitespace-pre-line text-mist">{service.description}</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {service.features.map((f) => (
                <li key={f} className="flex items-start gap-3 rounded-xl border hairline bg-white/[0.02] p-3 text-sm text-mist"><Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" /> {f}</li>
              ))}
            </ul>
          </section>

          <section className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="glass rounded-2xl p-5">
              <KeyRound className="h-5 w-5 text-gold-300" />
              <h3 className="mt-3 text-sm font-semibold text-ivory">{access.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-fog">{access.body}</p>
            </div>
            <div className="glass rounded-2xl p-5">
              <ShieldCheck className="h-5 w-5 text-gold-300" />
              <h3 className="mt-3 text-sm font-semibold text-ivory">Authorization</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-fog">
                {service.authorization ? AUTH_COPY[service.authorization.kind] : "Authorization on file"}
                {service.authorization?.validUntil && <> · valid until {formatDate(service.authorization.validUntil)}</>}
              </p>
            </div>
          </section>

          <section className="mt-12" aria-labelledby="reviews">
            <h2 id="reviews" className="text-lg font-semibold text-ivory">Ratings & reviews</h2>
            {user && rentedCount > 0 && !ownReview && <div className="mt-4"><ReviewForm serviceId={service.id} /></div>}
            <ul className="mt-5 space-y-3">
              {service.reviews.map((r) => (
                <li key={r.id} className="glass rounded-2xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex" aria-label={`${r.rating} out of 5`}>{Array.from({ length: 5 }, (_, i) => <Star key={i} className={i < r.rating ? "h-3.5 w-3.5 fill-gold-400 text-gold-400" : "h-3.5 w-3.5 text-smoke"} />)}</span>
                      <span className="text-sm font-semibold text-ivory">{r.title}</span>
                    </div>
                    {!r.isDemo && <span className="flex items-center gap-1 text-[11px] text-success"><BadgeCheck className="h-3 w-3" /> Verified rental</span>}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-mist">{r.body}</p>
                  <p className="mt-3 text-xs text-fog">{r.authorName} · {formatDate(r.createdAt)}</p>
                </li>
              ))}
              {service.reviews.length === 0 && <li className="text-sm text-fog">No reviews yet.</li>}
            </ul>
          </section>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-4">
            <RentalPanel plans={service.plans} signedIn={!!user} memberDiscountBps={ent?.plan.rentalDiscountBps ?? 0} planName={ent?.paid ? ent.plan.name : null} credits={credits} maxCreditShare={siteConfig.maxCreditShare} serverNow={now.toISOString()} available={isAvailable} creditsEnabled={creditsEnabled} />
            <Link href={`/providers/${service.seller.slug}`} className="glass block rounded-2xl p-5 transition-colors hover:border-gold-400/30">
              <p className="text-xs text-fog">Provider</p>
              <p className="mt-1 flex items-center gap-2 font-semibold text-ivory">{service.seller.displayName} {service.seller.verified && <VerifiedBadge />}</p>
              <p className="mt-1.5 line-clamp-2 text-sm text-fog">{service.seller.bio}</p>
            </Link>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="text-xl font-semibold text-ivory">More in {service.category.name}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((s) => <ServiceCard key={s.id} service={s} favorite={favorites.has(s.id)} />)}
          </div>
        </section>
      )}
    </div>
  );
}
