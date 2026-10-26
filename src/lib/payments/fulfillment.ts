import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "../db";
import { audit, notify } from "../audit";
import { bookCredits } from "../credits";
import { commissionSplit } from "../pricing";
import { checkPaymentFailures } from "../fraud";
import { getPlatformSettings } from "../settings";
import { activateRental, applyExtension } from "../rentals/service";
import { activateSubscription } from "../subscriptions/service";
import { CREDIT_VALUE_MINOR } from "../pricing";
import { getPaymentProvider } from ".";
import type { NormalizedPaymentEvent } from "./types";

type Tx = Prisma.TransactionClient;

export type ProcessResult = { status: "processed" | "duplicate" | "ignored" | "rejected"; detail?: string };

/**
 * Single entry point for provider events (webhooks and sandbox simulations).
 * 1. Signature is verified against the raw body.
 * 2. The event id is recorded under a unique constraint — duplicates are no-ops.
 * 3. Order/payment transitions are conditional updates, so concurrent deliveries
 *    of *different* events for the same payment also fulfil at most once.
 */
export async function processProviderWebhook(
  providerName: string,
  rawBody: string,
  signature: string | null,
  headers: Headers,
  now = new Date(),
): Promise<ProcessResult> {
  const provider = getPaymentProvider(providerName);
  if (provider.name !== providerName) return { status: "rejected", detail: "unknown_provider" };
  if (!provider.verifyWebhookSignature(rawBody, signature)) return { status: "rejected", detail: "invalid_signature" };

  let event: NormalizedPaymentEvent;
  try {
    event = provider.parseWebhook(rawBody, headers);
  } catch {
    return { status: "rejected", detail: "malformed_payload" };
  }

  try {
    return await db.$transaction(async (tx) => {
      await tx.webhookEvent.create({
        data: { provider: provider.name, eventId: event.eventId, type: event.type, payload: JSON.parse(rawBody) as Prisma.InputJsonValue },
      });
      if (event.type === "payment.captured") return handleCaptured(tx, event, now);
      if (event.type === "payment.failed") return handleFailed(tx, event, now);
      return { status: "ignored" as const, detail: event.type };
    });
  } catch (err) {
    // Only the event-id constraint means "already processed"; any other conflict is a real error.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002" && isWebhookEventConflict(err)) return { status: "duplicate" };
    throw err;
  }
}

function isWebhookEventConflict(err: Prisma.PrismaClientKnownRequestError) {
  const meta = err.meta as { modelName?: string; target?: string[] | string } | undefined;
  const target = Array.isArray(meta?.target) ? meta.target.join(",") : (meta?.target ?? "");
  return meta?.modelName === "WebhookEvent" || target.includes("eventId");
}

async function handleCaptured(tx: Tx, event: NormalizedPaymentEvent, now: Date): Promise<ProcessResult> {
  const payment = await tx.payment.findUnique({ where: { providerOrderId: event.providerOrderId ?? "" }, include: { order: true } });
  if (!payment) return { status: "ignored", detail: "unknown_payment" };

  if (event.amountMinor !== undefined && event.amountMinor !== payment.amountMinor) {
    await tx.fraudFlag.create({
      data: { userId: payment.order.userId, orderId: payment.orderId, reason: `Captured amount ${event.amountMinor} ≠ expected ${payment.amountMinor}`, severity: "high" },
    });
    return { status: "rejected", detail: "amount_mismatch" };
  }

  await tx.payment.updateMany({
    where: { id: payment.id, status: { in: ["CREATED", "FAILED"] } },
    data: { status: "CAPTURED", providerPaymentId: event.providerPaymentId ?? null, failureReason: null },
  });
  const moved = await tx.order.updateMany({
    where: { id: payment.orderId, status: { in: ["PENDING", "FAILED"] } },
    data: { status: "PAID", paidAt: now },
  });
  if (moved.count === 0) return { status: "duplicate", detail: "order_already_settled" };

  await fulfilOrder(tx, payment.orderId, now);
  return { status: "processed" };
}

async function handleFailed(tx: Tx, event: NormalizedPaymentEvent, now: Date): Promise<ProcessResult> {
  const payment = await tx.payment.findUnique({ where: { providerOrderId: event.providerOrderId ?? "" }, include: { order: true } });
  if (!payment) return { status: "ignored", detail: "unknown_payment" };
  await tx.payment.updateMany({ where: { id: payment.id, status: "CREATED" }, data: { status: "FAILED", failureReason: event.reason ?? "Payment failed" } });
  const moved = await tx.order.updateMany({ where: { id: payment.orderId, status: "PENDING" }, data: { status: "FAILED" } });
  if (moved.count === 0) return { status: "duplicate", detail: "order_not_pending" };
  // Release held credits; re-held if the customer retries.
  await bookCredits(tx, { userId: payment.order.userId, delta: payment.order.creditsApplied, reason: "checkout_release", refType: "payment", refId: payment.id });
  await notify(payment.order.userId, { kind: "payment_failed", title: "Payment didn't go through", body: `${payment.order.description} — you can retry from checkout.`, href: `/checkout/${payment.orderId}` }, tx);
  await checkPaymentFailures(tx, payment.order.userId, now);
  return { status: "processed" };
}

async function fulfilOrder(tx: Tx, orderId: string, now: Date) {
  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { rental: { include: { service: { select: { sellerId: true, name: true } } } } },
  });

  if (order.promoCodeId) {
    await tx.promoCode.update({ where: { id: order.promoCodeId }, data: { redemptions: { increment: 1 } } });
  }

  if (order.purpose === "RENTAL_NEW" && order.rentalId) {
    const result = await activateRental(tx, order.rentalId, now);
    if (result === "capacity_full") {
      // Paid but the provider filled up in the meantime: refund automatically.
      await tx.order.update({ where: { id: order.id }, data: { status: "REFUNDED" } });
      await tx.rental.update({ where: { id: order.rentalId }, data: { status: "REFUNDED", cancelledAt: now } });
      await tx.refund.create({
        data: { orderId: order.id, amountMinor: order.totalMinor, reason: "Service reached capacity before activation", status: "PROCESSED", requestedById: order.userId },
      });
      await bookCredits(tx, { userId: order.userId, delta: order.creditsApplied, reason: "refund_release", refType: "order", refId: order.id });
      await notify(order.userId, { kind: "refund", title: "Rental refunded", body: "The service filled up before your rental could start, so we refunded you in full." }, tx);
      return;
    }
  }

  if (order.purpose === "RENTAL_EXTEND" && order.rentalId && order.extendMinutes) {
    const ok = await applyExtension(tx, order.rentalId, order.extendMinutes, now);
    if (!ok) throw new Error(`Extension could not be applied for order ${order.id}`);
    await notify(order.userId, { kind: "rental_extended", title: "Rental extended", body: order.description, href: `/dashboard/rentals/${order.rentalId}` }, tx);
  }

  if (order.purpose === "SUBSCRIPTION") await activateSubscription(tx, order, now);

  if (order.rental) {
    const seller = await tx.seller.findUniqueOrThrow({ where: { id: order.rental.service.sellerId } });
    const settings = await getPlatformSettings(tx);
    const rate = seller.commissionRateBps ?? settings.commissionRateBps;
    // Credits are platform-funded, so the seller is paid on the post-discount price.
    const gross = order.totalMinor + order.creditsApplied * CREDIT_VALUE_MINOR;
    await tx.commission.create({ data: { orderId: order.id, sellerId: seller.id, grossMinor: gross, rateBps: rate, ...commissionSplit(gross, rate) } });
  }

  await audit({ actorId: order.userId, action: "order.paid", entityType: "Order", entityId: order.id, metadata: { purpose: order.purpose, total: order.totalMinor } }, tx);
}

/** Retry a failed/pending order with a fresh payment attempt (re-holding credits). */
export async function retryOrderPayment(userId: string, orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== userId) return null;
  if (order.status !== "FAILED" && order.status !== "PENDING") return null;
  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data: { status: "PENDING" } });
    if (order.status === "FAILED" && order.creditsApplied > 0) {
      await bookCredits(tx, { userId, delta: -order.creditsApplied, reason: `checkout_rehold_${Date.now()}`, refType: "order", refId: order.id });
    }
  });
  const { openPaymentAttempt } = await import("../orders");
  return openPaymentAttempt(db, order);
}

/** Admin-approved refund: provider refund, then local state, commission reversal. */
export async function processRefund(refundId: string, adminId: string, now = new Date()) {
  const refund = await db.refund.findUnique({ where: { id: refundId }, include: { order: { include: { payments: true, commission: true } } } });
  if (!refund || (refund.status !== "REQUESTED" && refund.status !== "APPROVED")) return { ok: false as const, reason: "not_refundable" };
  const payment = refund.order.payments.find((p) => p.status === "CAPTURED");
  if (payment?.providerPaymentId) {
    await getPaymentProvider(payment.provider).refund({ providerPaymentId: payment.providerPaymentId, amountMinor: refund.amountMinor });
  }
  await db.$transaction(async (tx) => {
    const moved = await tx.refund.updateMany({ where: { id: refund.id, status: { in: ["REQUESTED", "APPROVED"] } }, data: { status: "PROCESSED", reviewedById: adminId, paymentId: payment?.id } });
    if (!moved.count) return;
    await tx.order.update({ where: { id: refund.orderId }, data: { status: "REFUNDED" } });
    if (payment) await tx.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED" } });
    if (refund.order.rentalId && refund.order.purpose === "RENTAL_NEW") {
      await tx.rental.update({ where: { id: refund.order.rentalId }, data: { status: "REFUNDED", cancelledAt: now } });
    }
    if (refund.order.commission && refund.order.commission.status !== "PAID_OUT") {
      await tx.commission.update({ where: { id: refund.order.commission.id }, data: { status: "REVERSED" } });
    }
    await bookCredits(tx, { userId: refund.order.userId, delta: refund.order.creditsApplied, reason: "refund_release", refType: "order", refId: refund.orderId });
    await notify(refund.order.userId, { kind: "refund", title: "Refund processed", body: `${refund.order.description} was refunded.`, href: "/dashboard/billing" }, tx);
    await audit({ actorId: adminId, action: "refund.process", entityType: "Refund", entityId: refund.id, metadata: { amount: refund.amountMinor } }, tx);
  });
  return { ok: true as const };
}
