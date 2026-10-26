import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { conflict, handler, json, parseBody } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

const schema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,20}$/, "Use 3–20 letters or numbers."),
  description: z.string().trim().max(120).default(""),
  percentOff: z.number().int().min(1).max(90),
  maxRedemptions: z.number().int().min(1).nullable().default(null),
  expiresAt: z.iso.datetime().nullable().default(null),
});

export const POST = handler(async (req) => {
  const admin = await requireAdmin();
  const body = await parseBody(req, schema);
  try {
    const promo = await db.promoCode.create({ data: { ...body, expiresAt: body.expiresAt ? new Date(body.expiresAt) : null } });
    await audit({ actorId: admin.id, action: "promo.create", entityType: "PromoCode", entityId: promo.id, metadata: { code: promo.code } });
    return json({ ok: true }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") throw conflict("That code already exists.");
    throw err;
  }
});
