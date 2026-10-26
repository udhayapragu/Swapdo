import { handler, json } from "@/lib/http";
import { parseMarketplaceQuery, searchServices, startingPrice } from "@/lib/catalog";

export const GET = handler(async (req) => {
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const services = await searchServices(parseMarketplaceQuery(sp));
  return json({
    services: services.map((s) => ({
      id: s.id, slug: s.slug, name: s.name, tagline: s.tagline, category: s.category, provider: s.seller,
      isDemo: s.isDemo, ratingAvg: s.ratingAvg, ratingCount: s.ratingCount, fromPriceMinor: startingPrice(s),
      plans: s.plans.map((p) => ({ id: p.id, durationMinutes: p.durationMinutes, priceMinor: p.priceMinor, usageLimit: p.usageLimit, usageUnit: p.usageUnit })),
    })),
  });
});
