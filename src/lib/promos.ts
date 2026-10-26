import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { badRequest } from "./http";
import { isFeatureEnabled } from "./settings";

type Tx = Prisma.TransactionClient | typeof db;

export async function resolvePromo(code: string | undefined | null, now = new Date(), tx: Tx = db) {
  if (!code) return null;
  if (!(await isFeatureEnabled("promo_codes", tx))) throw badRequest("Promo codes are currently disabled.");
  const promo = await tx.promoCode.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (
    !promo ||
    !promo.active ||
    (promo.expiresAt && promo.expiresAt <= now) ||
    (promo.maxRedemptions !== null && promo.redemptions >= promo.maxRedemptions)
  ) {
    throw badRequest("That promo code is invalid or has expired.");
  }
  return promo;
}
