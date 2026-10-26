import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { DURATION_FILTERS } from "@/config/durations";

export type MarketplaceQuery = {
  q?: string;
  category?: string;
  duration?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "popular" | "price-asc" | "price-desc" | "newest" | "rating";
  verified?: boolean;
};

export const serviceCardInclude = {
  seller: { select: { displayName: true, slug: true, verified: true } },
  category: { select: { name: true, slug: true, accent: true } },
  plans: { where: { active: true }, orderBy: { durationMinutes: "asc" } },
} satisfies Prisma.ServiceInclude;

export type ServiceCardData = Prisma.ServiceGetPayload<{ include: typeof serviceCardInclude }>;

export function parseMarketplaceQuery(sp: Record<string, string | string[] | undefined>): MarketplaceQuery {
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : sp[k]) || undefined;
  const num = (k: string) => {
    const v = Number(one(k));
    return Number.isFinite(v) && v >= 0 ? v : undefined;
  };
  const sort = one("sort");
  return {
    q: one("q")?.slice(0, 80),
    category: one("category"),
    duration: one("duration"),
    minPrice: num("min"),
    maxPrice: num("max"),
    sort: (["popular", "price-asc", "price-desc", "newest", "rating"] as const).find((s) => s === sort) ?? "popular",
    verified: one("verified") === "1",
  };
}

export const startingPrice = (s: { plans: { priceMinor: number }[] }) =>
  s.plans.length ? Math.min(...s.plans.map((p) => p.priceMinor)) : 0;

export async function searchServices(query: MarketplaceQuery) {
  const where: Prisma.ServiceWhereInput = { status: "APPROVED" };
  if (query.category) where.category = { slug: query.category };
  if (query.verified) where.seller = { verified: true };
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { tagline: { contains: query.q, mode: "insensitive" } },
      { tags: { has: query.q.toLowerCase() } },
      { seller: { displayName: { contains: query.q, mode: "insensitive" } } },
      { category: { name: { contains: query.q, mode: "insensitive" } } },
    ];
  }
  const orderBy: Prisma.ServiceOrderByWithRelationInput[] =
    query.sort === "newest" ? [{ createdAt: "desc" }] : query.sort === "rating" ? [{ ratingAvg: "desc" }] : [{ popularity: "desc" }];

  let services = await db.service.findMany({ where, include: serviceCardInclude, orderBy, take: 200 });

  // Duration and price filters operate on the plan set of each service.
  const durationFilter = DURATION_FILTERS.find((d) => d.value === query.duration);
  if (durationFilter) services = services.filter((s) => s.plans.some((p) => durationFilter.match(p.durationMinutes)));
  if (query.minPrice !== undefined) services = services.filter((s) => startingPrice(s) >= query.minPrice! * 100);
  if (query.maxPrice !== undefined) services = services.filter((s) => startingPrice(s) <= query.maxPrice! * 100);
  if (query.sort === "price-asc") services.sort((a, b) => startingPrice(a) - startingPrice(b));
  if (query.sort === "price-desc") services.sort((a, b) => startingPrice(b) - startingPrice(a));
  return services;
}

export async function getCategories() {
  return db.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { services: { where: { status: "APPROVED" } } } } },
  });
}

export async function getFeaturedServices(take = 6) {
  return db.service.findMany({
    where: { status: "APPROVED", featured: true },
    include: serviceCardInclude,
    orderBy: { popularity: "desc" },
    take,
  });
}

export async function getMembershipPlans() {
  return db.subscriptionPlan.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
}

/** Live capacity usage for services that have a cap. */
export async function getAvailability(services: { id: string; capacity: number | null }[], now = new Date()) {
  const capped = services.filter((s) => s.capacity !== null);
  const map = new Map<string, { capacity: number | null; inUse: number }>();
  if (!capped.length) return map;
  const counts = await db.rental.groupBy({
    by: ["serviceId"],
    where: { serviceId: { in: capped.map((s) => s.id) }, status: "ACTIVE", endsAt: { gt: now } },
    _count: true,
  });
  for (const s of capped) map.set(s.id, { capacity: s.capacity, inUse: counts.find((c) => c.serviceId === s.id)?._count ?? 0 });
  return map;
}

export async function getFavoriteIds(userId: string | undefined): Promise<Set<string>> {
  if (!userId) return new Set();
  const favs = await db.favorite.findMany({ where: { userId }, select: { serviceId: true } });
  return new Set(favs.map((f) => f.serviceId));
}
