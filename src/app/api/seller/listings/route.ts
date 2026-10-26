import { db } from "@/lib/db";
import { badRequest, handler, json, parseBody } from "@/lib/http";
import { requireApprovedSeller } from "@/lib/auth/session";
import { listingSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { audit } from "@/lib/audit";
import { DEMO_CATEGORIES } from "@/data/demo-catalog";

export const POST = handler(async (req) => {
  const user = await requireApprovedSeller();
  const body = await parseBody(req, listingSchema);
  const auth = await db.providerAuthorization.findUnique({ where: { id: body.authorizationId } });
  if (!auth || auth.sellerId !== user.sellerId) throw badRequest("Choose one of your authorizations.");
  if (auth.status !== "APPROVED" || (auth.validUntil && auth.validUntil < new Date())) {
    throw badRequest("That authorization isn't approved (or has expired). Listings require a valid authorization.");
  }
  const category = await db.category.findUnique({ where: { id: body.categoryId } });
  if (!category?.active) throw badRequest("Choose a valid category.");
  const base = slugify(body.name);
  const slug = (await db.service.count({ where: { slug: base } })) ? `${base}-${Date.now().toString(36)}` : base;
  const service = await db.service.create({
    data: {
      slug, name: body.name, tagline: body.tagline, description: body.description, features: body.features, tags: body.tags.map((t) => t.toLowerCase()),
      categoryId: category.id, sellerId: user.sellerId, authorizationId: auth.id, accessMethod: body.accessMethod, capacity: body.capacity,
      icon: category.icon, accent: DEMO_CATEGORIES.find((c) => c.slug === category.slug)?.accent ?? category.accent,
      status: body.submit ? "PENDING_REVIEW" : "DRAFT",
      plans: { create: body.plans },
    },
  });
  await audit({ actorId: user.id, action: body.submit ? "listing.submit" : "listing.draft", entityType: "Service", entityId: service.id });
  return json({ ok: true, serviceId: service.id }, { status: 201 });
});
