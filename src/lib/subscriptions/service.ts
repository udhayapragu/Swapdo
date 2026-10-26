import "server-only";
import type { BillingInterval, Prisma, SubscriptionPlan } from "@prisma/client";
import { db } from "../db";
import { badRequest, conflict, notFound } from "../http";
import { bookCredits, creditBalance, lockUser } from "../credits";
import { createOrder, openPaymentAttempt } from "../orders";
import { prorationCredit, quote } from "../pricing";
import { resolvePromo } from "../promos";
import { audit, notify } from "../audit";
import { getPaymentProvider } from "../payments";
import { getFreePlan } from "./entitlements";

type Tx = Prisma.TransactionClient;

export const priceFor = (plan: SubscriptionPlan, interval: BillingInterval) =>
  interval === "ANNUAL" ? plan.annualPriceMinor : plan.monthlyPriceMinor;

export function periodEnd(start: Date, interval: BillingInterval): Date {
  const end = new Date(start);
  if (interval === "ANNUAL") end.setUTCFullYear(end.getUTCFullYear() + 1);
  else end.setUTCMonth(end.getUTCMonth() + 1);
  return end;
}

/** Credits granted per paid period. Annual plans receive the full year's credits upfront. */
export const creditsFor = (plan: SubscriptionPlan, interval: BillingInterval) =>
  interval === "ANNUAL" ? plan.monthlyCredits * 12 : plan.monthlyCredits;

export type SubscriptionCheckoutResult =
  | { kind: "requires_payment"; orderId: string }
  | { kind: "scheduled"; effectiveAt: Date | null; planName: string };

export async function startSubscriptionChange(
  userId: string,
  input: { planCode: string; interval: BillingInterval; promoCode?: string },
  now = new Date(),
): Promise<SubscriptionCheckoutResult> {
  const target = await db.subscriptionPlan.findUnique({ where: { code: input.planCode } });
  if (!target || !target.active) throw notFound("That membership plan is not available.");
  const sub = await db.subscription.findUnique({ where: { userId }, include: { plan: true } });

  // Moving to Free is a cancellation at period end.
  if (target.code === "FREE") {
    if (!sub || sub.plan.code === "FREE") throw conflict("You're already on the Free plan.");
    await cancelAtPeriodEnd(userId);
    return { kind: "scheduled", effectiveAt: sub.currentPeriodEnd, planName: target.name };
  }

  const current = sub?.plan;
  const currentInForce = !!sub && sub.status === "ACTIVE" && current?.code !== "FREE";
  if (currentInForce && current!.id === target.id && sub!.interval === input.interval) {
    throw conflict(`You're already on ${target.name} (${input.interval.toLowerCase()}).`);
  }

  const targetMonthly = target.monthlyPriceMinor;
  const isDowngrade = currentInForce && targetMonthly < current!.monthlyPriceMinor;
  if (isDowngrade) {
    await db.subscription.update({ where: { userId }, data: { scheduledPlanId: target.id, interval: input.interval, cancelAtPeriodEnd: false } });
    await audit({ actorId: userId, action: "subscription.downgrade_scheduled", entityType: "Subscription", entityId: sub!.id, metadata: { to: target.code } });
    return { kind: "scheduled", effectiveAt: sub!.currentPeriodEnd, planName: target.name };
  }

  // New subscription, upgrade, interval change, or paying a past-due plan.
  const promo = await resolvePromo(input.promoCode, now);
  let proration = 0;
  if (currentInForce && sub!.currentPeriodEnd) {
    proration = prorationCredit(priceFor(current!, sub!.interval), sub!.currentPeriodStart, sub!.currentPeriodEnd, now);
  }
  const order = await db.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const q = quote({
      basePriceMinor: priceFor(target, input.interval),
      membershipDiscountBps: 0,
      promoPercentOff: promo?.percentOff,
      prorationCreditMinor: proration,
      creditsAvailable: await creditBalance(userId, tx),
      useCredits: false,
      maxCreditShare: 0,
    });
    if (q.totalMinor <= 0) throw badRequest("This change has nothing to pay — contact support to switch plans.");
    return createOrder(tx, {
      userId,
      purpose: "SUBSCRIPTION",
      description: `${target.name} membership · ${input.interval === "ANNUAL" ? "annual" : "monthly"}`,
      quote: q,
      subscriptionPlanCode: target.code,
      billingInterval: input.interval,
      promoCodeId: promo?.id,
    });
  });
  await openPaymentAttempt(db, order);
  return { kind: "requires_payment", orderId: order.id };
}

/** Called once per paid SUBSCRIPTION order, inside the fulfilment transaction. */
export async function activateSubscription(
  tx: Tx,
  order: { id: string; userId: string; subscriptionPlanCode: string | null; billingInterval: BillingInterval | null },
  now: Date,
) {
  const plan = await tx.subscriptionPlan.findUnique({ where: { code: order.subscriptionPlanCode ?? "" } });
  if (!plan) throw new Error(`Unknown plan on order ${order.id}`);
  const interval = order.billingInterval ?? "MONTHLY";
  const data = {
    planId: plan.id,
    interval,
    status: "ACTIVE" as const,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd(now, interval),
    cancelAtPeriodEnd: false,
    scheduledPlanId: null,
    graceUntil: null,
  };
  await tx.subscription.upsert({ where: { userId: order.userId }, update: data, create: { userId: order.userId, ...data } });
  await bookCredits(tx, { userId: order.userId, delta: creditsFor(plan, interval), reason: "membership_credits", refType: "order", refId: order.id });
  await notify(order.userId, { kind: "subscription", title: `Welcome to ${plan.name}`, body: `${creditsFor(plan, interval)} credits were added to your balance.`, href: "/dashboard/subscription" }, tx);
}

export async function cancelAtPeriodEnd(userId: string) {
  const sub = await db.subscription.findUnique({ where: { userId }, include: { plan: true } });
  if (!sub || sub.plan.code === "FREE") throw conflict("There's no paid membership to cancel.");
  await db.subscription.update({ where: { userId }, data: { cancelAtPeriodEnd: true, scheduledPlanId: null } });
  await audit({ actorId: userId, action: "subscription.cancel", entityType: "Subscription", entityId: sub.id });
}

export async function resumeSubscription(userId: string) {
  const sub = await db.subscription.findUnique({ where: { userId } });
  if (!sub || (!sub.cancelAtPeriodEnd && !sub.scheduledPlanId)) throw conflict("Nothing to resume.");
  await db.subscription.update({ where: { userId }, data: { cancelAtPeriodEnd: false, scheduledPlanId: null } });
  await audit({ actorId: userId, action: "subscription.resume", entityType: "Subscription", entityId: sub.id });
}

/**
 * Renewal engine. Run on a schedule (see /api/cron/billing). Idempotent:
 * each renewal is keyed by subscription + period, so re-runs don't double charge.
 */
export async function runBillingCycle(now = new Date()) {
  const free = await getFreePlan();
  const due = await db.subscription.findMany({
    where: {
      OR: [
        { status: "ACTIVE", currentPeriodEnd: { lte: now } },
        { status: "PAST_DUE" },
      ],
    },
    include: { plan: true, scheduledPlan: true },
    take: 200,
  });
  const summary = { renewed: 0, downgraded: 0, failed: 0, expired: 0 };

  for (const sub of due) {
    if (sub.plan.code === "FREE") continue;

    // Grace period exhausted → drop to Free.
    if (sub.status === "PAST_DUE" && sub.graceUntil && sub.graceUntil <= now) {
      await db.subscription.update({
        where: { id: sub.id },
        data: { status: "ACTIVE", planId: free.id, currentPeriodStart: now, currentPeriodEnd: null, graceUntil: null, scheduledPlanId: null },
      });
      await notify(sub.userId, { kind: "subscription", title: "Membership ended", body: `We couldn't renew ${sub.plan.name}, so your account moved to Free.`, href: "/dashboard/subscription" });
      summary.expired++;
      continue;
    }

    if (sub.status === "ACTIVE" && sub.cancelAtPeriodEnd) {
      await db.subscription.update({
        where: { id: sub.id },
        data: { planId: free.id, currentPeriodStart: now, currentPeriodEnd: null, cancelAtPeriodEnd: false },
      });
      await notify(sub.userId, { kind: "subscription", title: "Membership cancelled", body: `${sub.plan.name} has ended. You're now on Free.`, href: "/dashboard/subscription" });
      summary.downgraded++;
      continue;
    }

    const plan = sub.scheduledPlan ?? sub.plan;
    const amount = priceFor(plan, sub.interval);
    const periodKey = `${sub.id}:${(sub.currentPeriodEnd ?? now).toISOString()}`;
    const succeeded = !sub.simulateRenewalFailure; // sandbox: real providers need saved mandates (e.g. Razorpay Subscriptions)
    const provider = getPaymentProvider();

    await db.$transaction(async (tx) => {
      const existing = await tx.payment.findUnique({ where: { providerOrderId: `renewal_${periodKey}` } });
      if (existing?.status === "CAPTURED") return;

      const order = existing
        ? await tx.order.findUniqueOrThrow({ where: { id: existing.orderId } })
        : await createOrder(tx, {
            userId: sub.userId,
            purpose: "SUBSCRIPTION",
            description: `${plan.name} membership renewal · ${sub.interval === "ANNUAL" ? "annual" : "monthly"}`,
            quote: { subtotalMinor: amount, discountMinor: 0, creditsApplied: 0, totalMinor: amount },
            subscriptionPlanCode: plan.code,
            billingInterval: sub.interval,
          });
      if (!existing) {
        await tx.payment.create({
          data: { orderId: order.id, provider: provider.name, providerOrderId: `renewal_${periodKey}`, amountMinor: amount, sandbox: true },
        });
      }

      if (succeeded) {
        await tx.payment.update({ where: { providerOrderId: `renewal_${periodKey}` }, data: { status: "CAPTURED", providerPaymentId: `renewal_pay_${order.id}` } });
        await tx.order.update({ where: { id: order.id }, data: { status: "PAID", paidAt: now } });
        const start = sub.status === "PAST_DUE" ? now : (sub.currentPeriodEnd ?? now);
        await tx.subscription.update({
          where: { id: sub.id },
          data: { status: "ACTIVE", planId: plan.id, scheduledPlanId: null, graceUntil: null, currentPeriodStart: start, currentPeriodEnd: periodEnd(start, sub.interval) },
        });
        await bookCredits(tx, { userId: sub.userId, delta: creditsFor(plan, sub.interval), reason: "membership_credits", refType: "order", refId: order.id });
        await notify(sub.userId, { kind: "subscription", title: `${plan.name} renewed`, body: "Your membership renewed and fresh credits were added.", href: "/dashboard/billing" }, tx);
        summary.renewed++;
      } else {
        await tx.payment.update({ where: { providerOrderId: `renewal_${periodKey}` }, data: { status: "FAILED", failureReason: "Card declined (sandbox simulation)" } });
        await tx.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
        if (sub.status !== "PAST_DUE") {
          const graceUntil = new Date(now.getTime() + plan.gracePeriodDays * 86400000);
          await tx.subscription.update({ where: { id: sub.id }, data: { status: "PAST_DUE", graceUntil } });
          await notify(sub.userId, { kind: "payment_failed", title: "Renewal payment failed", body: `Update your payment to keep ${plan.name}. Benefits continue until ${graceUntil.toDateString()}.`, href: "/dashboard/subscription" }, tx);
        }
        summary.failed++;
      }
    });
  }
  return summary;
}
