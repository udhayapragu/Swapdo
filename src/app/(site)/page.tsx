import { ArrowRight } from "lucide-react";
import { Hero, type HeroCard } from "@/components/marketing/hero";
import { SectionHeading } from "@/components/marketing/section-heading";
import { CategoryGrid } from "@/components/marketing/category-grid";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { TrustGrid } from "@/components/marketing/trust";
import { MembershipPlans } from "@/components/marketing/membership-plans";
import { ServiceCard } from "@/components/marketplace/service-card";
import { ButtonLink } from "@/components/ui/button";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { getAvailability, getCategories, getFavoriteIds, getFeaturedServices, getMembershipPlans, startingPrice } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth/session";
import { getEntitlements } from "@/lib/subscriptions/entitlements";
import { formatMoney } from "@/lib/money";
import { durationShort } from "@/config/durations";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const [categories, featured, plans, serviceCount, favorites, ent] = await Promise.all([
    getCategories(),
    getFeaturedServices(6),
    getMembershipPlans(),
    db.service.count({ where: { status: "APPROVED" } }),
    getFavoriteIds(user?.id),
    user ? getEntitlements(user.id) : null,
  ]);
  const availability = await getAvailability(featured);

  const heroCards: HeroCard[] = featured.slice(0, 4).map((s, i) => {
    const from = startingPrice(s);
    const plan = s.plans.find((p) => p.priceMinor === from)!;
    return { name: s.name, provider: s.seller.displayName, icon: s.icon, accent: s.accent, price: `${formatMoney(from)} / ${durationShort(plan.durationMinutes).toLowerCase()}`, minutesLeft: [163, 47, 1290, 312][i]! };
  });

  return (
    <>
      <Hero cards={heroCards} serviceCount={serviceCount} />

      <section className="container-page py-24" aria-labelledby="categories">
        <SectionHeading eyebrow="The marketplace" title="One address for every" accent="digital capability." body="Six curated worlds of authorized tools and services — each with flexible access, from a single hour to a full year." />
        <h2 id="categories" className="sr-only">Categories</h2>
        <CategoryGrid categories={categories} />
      </section>

      {featured.length > 0 && (
      <section className="container-page py-16" aria-labelledby="featured-heading">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading align="left" eyebrow="Featured" title="Trending this" accent="week." className="max-w-xl" />
          <Reveal>
            <ButtonLink href="/marketplace" variant="outline" size="sm">View all services <ArrowRight className="h-4 w-4" /></ButtonLink>
          </Reveal>
        </div>
        <h2 id="featured-heading" className="sr-only">Featured services</h2>
        <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((s) => (
            <StaggerItem key={s.id}>
              <ServiceCard service={s} favorite={favorites.has(s.id)} availability={availability.get(s.id)} />
            </StaggerItem>
          ))}
        </Stagger>
      </section>
      )}

      <section id="how-it-works" className="relative scroll-mt-24 py-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgb(106_79_209/0.12),transparent)]" aria-hidden />
        <div className="container-page">
          <SectionHeading eyebrow="How it works" title="Access in minutes." accent="Gone when you’re done." body="Time-based access, enforced on our servers — so you only ever pay for the window you actually use." />
          <HowItWorks />
        </div>
      </section>

      <section id="memberships" className="container-page scroll-mt-24 py-24">
        <SectionHeading eyebrow="Memberships" title="Rent more," accent="pay less." body="Members save on every rental, receive monthly credits and can run more services at once." />
        <MembershipPlans plans={plans} currentPlanCode={ent?.plan.code ?? null} signedIn={!!user} />
      </section>

      <section className="container-page py-24">
        <SectionHeading eyebrow="Trust & security" title="Luxury is" accent="peace of mind." body="Built on authorized integrations, verified payments and clear policies — never on shared logins." />
        <TrustGrid />
      </section>

      <section className="container-page pt-8">
        <Reveal>
          <div className="gold-border relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-obsidian-850 via-obsidian-900 to-violet-900/40 px-6 py-16 text-center sm:px-12">
            <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(201_164_95/0.28),transparent)]" aria-hidden />
            <h2 className="relative text-3xl font-semibold text-ivory sm:text-5xl">
              Your next tool is <span className="font-display font-normal italic text-gold">an hour away.</span>
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-mist">Create a free account, explore the marketplace and start your first rental in under a minute.</p>
            <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href={user ? "/marketplace" : "/register"} size="lg">{user ? "Browse services" : "Create free account"}</ButtonLink>
              <ButtonLink href="/sell" size="lg" variant="glass">Become a provider</ButtonLink>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
