import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteConfig } from "@/config/site";
import { LEGAL_DOCS } from "@/data/legal";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const [services, sellers, categories] = await Promise.all([
    db.service.findMany({ where: { status: "APPROVED" }, select: { slug: true, updatedAt: true } }),
    db.seller.findMany({ where: { status: "APPROVED" }, select: { slug: true, updatedAt: true } }),
    db.category.findMany({ where: { active: true }, select: { slug: true } }),
  ]);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/marketplace`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/memberships`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/sell`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/help`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.3 },
    ...categories.map((c) => ({ url: `${base}/marketplace?category=${c.slug}`, changeFrequency: "daily" as const, priority: 0.7 })),
    ...services.map((s) => ({ url: `${base}/marketplace/${s.slug}`, lastModified: s.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...sellers.map((s) => ({ url: `${base}/providers/${s.slug}`, lastModified: s.updatedAt, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...Object.keys(LEGAL_DOCS).map((slug) => ({ url: `${base}/legal/${slug}`, changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}
