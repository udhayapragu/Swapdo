import "server-only";
import type { Prisma } from "@prisma/client";
import { createHmac } from "node:crypto";
import { db } from "../db";
import { badRequest, conflict, forbidden, notFound } from "../http";
import { creditBalance, bookCredits, lockUser } from "../credits";
import { createOrder, openPaymentAttempt } from "../orders";
import { quote } from "../pricing";
import { resolvePromo } from "../promos";
import { checkOrderVelocity } from "../fraud";
import { audit, notify } from "../audit";
import { isFeatureEnabled } from "../settings";
import { getEntitlements } from "../subscriptions/entitlements";
import { accessDecision, activationWindow, MINUTE } from "./engine";
import { durationLabel } from "@/config/durations";
import { siteConfig } from "@/config/site";

type Tx = Prisma.TransactionClient;

/** Rentals that are ACTIVE and whose window has not lapsed, as of `now`. */
export const liveRentalWhere = (now: Date): Prisma.RentalWhereInput => ({ status: "ACTIVE", endsAt: { gt: now } });

export type CheckoutResult = { orderId: string; status: "requires_payment" | "paid"; rentalId?: string };

export async function createRentalCheckout(
  userId: string,
  input: { planId: string; promoCode?: string; useCredits?: boolean },
  now = new Date(),
): Promise<CheckoutResult> {
  const plan = await db.rentalPlan.findUnique({
    where: { id: input.planId },
    include: { service: { select: { id: true, name: true, status: true, capacity: true } } },
  });
  if (!plan || !plan.active) throw notFound("That rental option is no longer available.");
  if (plan.service.status !== "APPROVED") throw badRequest("This service is not currently available for rental.");

  const ent = await getEntitlements(userId, now);
  const live = await db.rental.count({ where: { userId, ...liveRentalWhere(now) } });
  if (live >= ent.plan.maxConcurrentRentals) {
    throw forbidden(
      `Your ${ent.plan.name} plan allows ${ent.plan.maxConcurrentRentals} active rental${ent.plan.maxConcurrentRentals === 1 ? "" : "s"} at a time. Upgrade your membership or wait for a rental to end.`,
    );
  }
  if (plan.service.capacity !== null) {
    const inUse = await db.rental.count({ where: { serviceId: plan.service.id, ...liveRentalWhere(now) } });
    if (inUse >= plan.service.capacity) throw conflict("This service is fully booked right now. Please try again shortly.");
  }

  const promo = await resolvePromo(input.promoCode, now);
  const creditsAllowed = input.useCredits && (await isFeatureEnabled("credits_at_checkout"));

  const order = await db.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const q = quote({
      basePriceMinor: plan.priceMinor,
      membershipDiscountBps: ent.plan.rentalDiscountBps,
      promoPercentOff: promo?.percentOff,
      creditsAvailable: creditsAllowed ? await creditBalance(userId, tx) : 0,
      useCredits: !!creditsAllowed,
      maxCreditShare: siteConfig.maxCreditShare,
    });
    const rental = await tx.rental.create({
      data: {
        userId,
        serviceId: plan.service.id,
        planId: plan.id,
        durationMinutes: plan.durationMinutes,
        usageLimit: plan.usageLimit,
      },
    });
    const order = await createOrder(tx, {
      userId,
      purpose: "RENTAL_NEW",
      description: `${plan.service.name} · ${durationLabel(plan.durationMinutes)}`,
      quote: q,
      rentalId: rental.id,
      promoCodeId: promo?.id,
    });
    // Credits are held when the order is created and released if it fails or is cancelled.
    await bookCredits(tx, { userId, delta: -q.creditsApplied, reason: "checkout_hold", refType: "order", refId: order.id });
    await checkOrderVelocity(tx, userId, order.id, now);
    return order;
  });

  // Provider calls happen outside the DB transaction.
  await openPaymentAttempt(db, order);
  return { orderId: order.id, status: "requires_payment", rentalId: order.rentalId ?? undefined };
}

export async function createExtensionCheckout(
  userId: string,
  input: { rentalId: string; planId: string; useCredits?: boolean },
  now = new Date(),
): Promise<CheckoutResult> {
  const rental = await db.rental.findUnique({ where: { id: input.rentalId }, include: { service: true } });
  if (!rental || rental.userId !== userId) throw notFound("Rental not found.");
  const plan = await db.rentalPlan.findUnique({ where: { id: input.planId } });
  if (!plan || !plan.active || plan.serviceId !== rental.serviceId) throw badRequest("Choose a valid extension option.");
  if (rental.service.status !== "APPROVED") throw badRequest("This service is no longer available.");

  const lapsed = rental.status !== "ACTIVE" || !rental.endsAt || rental.endsAt <= now;
  if (lapsed) {
    // Renewing an ended rental starts a fresh rental of the chosen length.
    return createRentalCheckout(userId, { planId: plan.id, useCredits: input.useCredits }, now);
  }

  const ent = await getEntitlements(userId, now);
  const creditsAllowed = input.useCredits && (await isFeatureEnabled("credits_at_checkout"));
  const order = await db.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const q = quote({
      basePriceMinor: plan.priceMinor,
      membershipDiscountBps: ent.plan.rentalDiscountBps,
      creditsAvailable: creditsAllowed ? await creditBalance(userId, tx) : 0,
      useCredits: !!creditsAllowed,
      maxCreditShare: siteConfig.maxCreditShare,
    });
    const order = await createOrder(tx, {
      userId,
      purpose: "RENTAL_EXTEND",
      description: `Extend ${rental.service.name} · +${durationLabel(plan.durationMinutes)}`,
      quote: q,
      rentalId: rental.id,
      extendMinutes: plan.durationMinutes,
    });
    await bookCredits(tx, { userId, delta: -q.creditsApplied, reason: "checkout_hold", refType: "order", refId: order.id });
    return order;
  });
  await openPaymentAttempt(db, order);
  return { orderId: order.id, status: "requires_payment", rentalId: rental.id };
}

/**
 * Activate a paid RENTAL_NEW order. Called inside the payment-fulfilment
 * transaction after the order has atomically moved PENDING → PAID, so it
 * runs at most once per order. The service row is locked so concurrent
 * activations cannot exceed capacity.
 */
export async function activateRental(tx: Tx, rentalId: string, now: Date): Promise<"activated" | "capacity_full" | "noop"> {
  const rental = await tx.rental.findUnique({ where: { id: rentalId }, include: { service: true } });
  if (!rental) return "noop";
  await tx.$queryRaw`SELECT id FROM "Service" WHERE id = ${rental.serviceId} FOR UPDATE`;
  if (rental.service.capacity !== null) {
    const inUse = await tx.rental.count({ where: { serviceId: rental.serviceId, ...liveRentalWhere(now) } });
    if (inUse >= rental.service.capacity) return "capacity_full";
  }
  const { startsAt, endsAt } = activationWindow(now, rental.durationMinutes);
  const res = await tx.rental.updateMany({
    where: { id: rentalId, status: "PENDING_PAYMENT" },
    data: { status: "ACTIVE", startsAt, endsAt, version: { increment: 1 } },
  });
  if (res.count === 0) return "noop";
  await tx.service.update({ where: { id: rental.serviceId }, data: { popularity: { increment: 1 } } });
  await notify(
    rental.userId,
    { kind: "rental_active", title: `${rental.service.name} is ready`, body: `Your access runs until ${endsAt.toUTCString()}.`, href: `/dashboard/rentals/${rental.id}` },
    tx,
  );
  return "activated";
}

/** Atomically extend an active (or just-lapsed) rental. Single SQL statement → no lost updates. */
export async function applyExtension(tx: Tx, rentalId: string, minutes: number, now: Date): Promise<boolean> {
  const affected = await tx.$executeRaw`
    UPDATE "Rental"
    SET "endsAt" = GREATEST("endsAt", ${now}) + make_interval(mins => ${minutes}::int),
        "status" = 'ACTIVE',
        "version" = "version" + 1,
        "updatedAt" = ${now}
    WHERE id = ${rentalId} AND status IN ('ACTIVE', 'EXPIRED') AND "endsAt" IS NOT NULL`;
  return affected === 1;
}

/** Record usage against a rental. The guard is part of the UPDATE, so limits hold under concurrency. */
export async function recordUsage(userId: string, rentalId: string, units: number, action: string, now = new Date()) {
  if (!Number.isInteger(units) || units < 1 || units > 100) throw badRequest("Invalid usage amount.");
  return db.$transaction(async (tx) => {
    const affected = await tx.$executeRaw`
      UPDATE "Rental" SET "usageCount" = "usageCount" + ${units}, "updatedAt" = ${now}
      WHERE id = ${rentalId} AND "userId" = ${userId} AND status = 'ACTIVE' AND "endsAt" > ${now}
        AND ("usageLimit" IS NULL OR "usageCount" + ${units} <= "usageLimit")`;
    const rental = await tx.rental.findUnique({ where: { id: rentalId } });
    if (!rental || rental.userId !== userId) throw notFound("Rental not found.");
    if (affected !== 1) {
      const d = accessDecision(rental, now);
      if (!d.ok && d.reason === "expired") throw forbidden("This rental has expired.");
      if (!d.ok && d.reason === "not_active") throw forbidden("This rental is not active.");
      throw forbidden("You've used all the included usage for this rental. Extend to keep going.");
    }
    await tx.usageRecord.create({ data: { userId, rentalId, serviceId: rental.serviceId, units, action } });
    return rental;
  });
}

/**
 * Server-side access check for a rental, used by every protected request.
 * Lazily persists expiry when the window has passed.
 */
export async function authorizeRentalAccess(userId: string, rentalId: string, now = new Date()) {
  const rental = await db.rental.findUnique({
    where: { id: rentalId },
    include: { service: { select: { id: true, name: true, accessMethod: true, isDemo: true, status: true } } },
  });
  if (!rental || rental.userId !== userId) throw notFound("Rental not found.");
  const decision = accessDecision(rental, now);
  if (!decision.ok && decision.reason === "expired" && rental.status === "ACTIVE") {
    await db.rental.updateMany({ where: { id: rental.id, status: "ACTIVE", endsAt: { lte: now } }, data: { status: "EXPIRED" } });
  }
  return { rental, decision };
}

/**
 * Short-lived, HMAC-signed access grant for the rented service. It expires at
 * the earlier of 15 minutes or the rental end, so it can never outlive access.
 * Real integrations would exchange this for a provider-issued token.
 */
export function issueAccessGrant(rental: { id: string; userId: string; serviceId: string; endsAt: Date | null }, now = new Date()) {
  const exp = Math.min(now.getTime() + 15 * MINUTE, rental.endsAt?.getTime() ?? now.getTime());
  const payload = Buffer.from(JSON.stringify({ r: rental.id, u: rental.userId, s: rental.serviceId, exp })).toString("base64url");
  const secret = process.env.ACCESS_GRANT_SECRET || process.env.MOCK_WEBHOOK_SECRET || "dev_access_secret";
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return { token: `${payload}.${sig}`, expiresAt: new Date(exp) };
}

export async function cancelPendingRental(userId: string, rentalId: string) {
  return db.$transaction(async (tx) => {
    const rental = await tx.rental.findUnique({ where: { id: rentalId }, include: { orders: true } });
    if (!rental || rental.userId !== userId) throw notFound("Rental not found.");
    const res = await tx.rental.updateMany({
      where: { id: rentalId, status: "PENDING_PAYMENT" },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    if (res.count === 0) throw conflict("Only rentals awaiting payment can be cancelled. For active rentals, request a refund.");
    for (const order of rental.orders) {
      // FAILED orders already released their credit hold when the payment failed.
      await tx.order.updateMany({ where: { id: order.id, status: "FAILED" }, data: { status: "CANCELLED" } });
      const moved = await tx.order.updateMany({ where: { id: order.id, status: "PENDING" }, data: { status: "CANCELLED" } });
      if (moved.count) {
        await bookCredits(tx, { userId, delta: order.creditsApplied, reason: "checkout_release", refType: "order", refId: order.id });
      }
    }
    await audit({ actorId: userId, action: "rental.cancel", entityType: "Rental", entityId: rentalId }, tx);
  });
}

/** Persist expiry for every lapsed rental. Safe to run repeatedly (cron + lazy). */
export async function expireLapsedRentals(now = new Date()) {
  const lapsed = await db.rental.findMany({
    where: { status: "ACTIVE", endsAt: { lte: now } },
    select: { id: true, userId: true, service: { select: { name: true } } },
    take: 500,
  });
  let expired = 0;
  for (const r of lapsed) {
    const res = await db.rental.updateMany({ where: { id: r.id, status: "ACTIVE", endsAt: { lte: now } }, data: { status: "EXPIRED" } });
    if (res.count) {
      expired++;
      await notify(r.userId, { kind: "rental_expired", title: `${r.service.name} access ended`, body: "Your rental period finished. Renew any time from your dashboard.", href: `/dashboard/rentals/${r.id}` });
    }
  }
  return { expired };
}
