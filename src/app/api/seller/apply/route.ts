import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { conflict, forbidden, handler, json, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";
import { sellerApplicationSchema } from "@/lib/validation";
import { isFeatureEnabled } from "@/lib/settings";
import { slugify } from "@/lib/utils";
import { audit } from "@/lib/audit";

export const POST = handler(async (req) => {
  const user = await requireUser();
  if (!(await isFeatureEnabled("seller_signups"))) throw forbidden("Provider applications are paused right now.");
  if (user.sellerId) throw conflict("You've already applied as a provider.");
  const body = await parseBody(req, sellerApplicationSchema);
  const base = slugify(body.displayName) || "provider";
  try {
    const seller = await db.$transaction(async (tx) => {
      const taken = await tx.seller.count({ where: { slug: base } });
      const seller = await tx.seller.create({
        data: { userId: user.id, slug: taken ? `${base}-${user.id.slice(-5)}` : base, displayName: body.displayName, bio: body.bio, website: body.website || null, country: body.country },
      });
      await tx.providerAuthorization.create({
        data: { sellerId: seller.id, kind: body.authorization.kind, title: body.authorization.title, reference: body.authorization.reference, documentUrl: body.authorization.documentUrl || null },
      });
      await audit({ actorId: user.id, action: "seller.apply", entityType: "Seller", entityId: seller.id }, tx);
      return seller;
    });
    return json({ ok: true, sellerId: seller.id }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") throw conflict("That provider name is taken.");
    throw err;
  }
});
