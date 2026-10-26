import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { mockProvider } from "@/lib/payments/mock";
import { processProviderWebhook } from "@/lib/payments/fulfillment";
import { authorizeRentalAccess, createExtensionCheckout, createRentalCheckout, recordUsage } from "@/lib/rentals/service";
import { creditBalance } from "@/lib/credits";
import { runBillingCycle, startSubscriptionChange } from "@/lib/subscriptions/service";
import { DEFAULT_MEMBERSHIP_PLANS } from "@/config/membership-plans";

const tag = randomBytes(4).toString("hex");
let userId: string;
let serviceId: string;
let planId: string;
let planDayId: string;

async function makeUser(label: string) {
  const u = await db.user.create({ data: { email: `${label}-${tag}-${randomBytes(3).toString("hex")}@test.dev`, name: label, passwordHash: "x" } });
  return u.id;
}

async function payOrder(orderId: string, eventId = `evt_${randomBytes(6).toString("hex")}`) {
  const payment = await db.payment.findFirstOrThrow({ where: { orderId }, orderBy: { createdAt: "desc" } });
  const { raw, signature } = mockProvider.signEvent({ id: eventId, event: "payment.captured", order_id: payment.providerOrderId, payment_id: `pay_${eventId}`, amount: payment.amountMinor });
  return processProviderWebhook("mock", raw, signature, new Headers());
}

beforeAll(async () => {
  for (const p of DEFAULT_MEMBERSHIP_PLANS) {
    await db.subscriptionPlan.upsert({ where: { code: p.code }, update: {}, create: { ...p, features: [...p.features] } });
  }
  await db.featureFlag.upsert({ where: { key: "credits_at_checkout" }, update: { enabled: true }, create: { key: "credits_at_checkout", enabled: true, description: "t" } });
  const owner = await makeUser("seller");
  const seller = await db.seller.create({ data: { userId: owner, slug: `s-${tag}`, displayName: "Test Seller", status: "APPROVED" } });
  const category = await db.category.upsert({ where: { slug: "test-cat" }, update: {}, create: { slug: "test-cat", name: "Test", tagline: "t", icon: "sparkles", accent: "#fff" } });
  const service = await db.service.create({
    data: {
      slug: `svc-${tag}`, name: "Test Service", tagline: "t", description: "d", status: "APPROVED", sellerId: seller.id, categoryId: category.id,
      plans: { create: [{ durationMinutes: 60, priceMinor: 10000, usageLimit: 5 }, { durationMinutes: 1440, priceMinor: 50000, usageLimit: null }] },
    },
    include: { plans: true },
  });
  serviceId = service.id;
  planId = service.plans.find((p) => p.durationMinutes === 60)!.id;
  planDayId = service.plans.find((p) => p.durationMinutes === 1440)!.id;
  userId = await makeUser("buyer");
  // Elite allows many concurrent rentals for the tests below.
  const elite = await db.subscriptionPlan.findUniqueOrThrow({ where: { code: "ELITE" } });
  await db.subscription.create({ data: { userId, planId: elite.id, status: "ACTIVE", currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 30 * 86400000) } });
});

afterAll(async () => {
  await db.$disconnect();
});

describe("rental lifecycle", () => {
  it("prices on the server and activates exactly once under duplicate & concurrent webhooks", async () => {
    const checkout = await createRentalCheckout(userId, { planId });
    const order = await db.order.findUniqueOrThrow({ where: { id: checkout.orderId } });
    expect(order.subtotalMinor).toBe(10000);
    expect(order.discountMinor).toBe(2000); // Elite 20%
    expect(order.totalMinor).toBe(8000);

    const payment = await db.payment.findFirstOrThrow({ where: { orderId: order.id } });
    const evt = mockProvider.signEvent({ id: `evt_dup_${tag}`, event: "payment.captured", order_id: payment.providerOrderId, payment_id: `pay_${tag}`, amount: payment.amountMinor });
    const evt2 = mockProvider.signEvent({ id: `evt_dup2_${tag}`, event: "payment.captured", order_id: payment.providerOrderId, payment_id: `pay_${tag}`, amount: payment.amountMinor });

    const results = await Promise.all([
      processProviderWebhook("mock", evt.raw, evt.signature, new Headers()),
      processProviderWebhook("mock", evt.raw, evt.signature, new Headers()),
      processProviderWebhook("mock", evt2.raw, evt2.signature, new Headers()),
    ]);
    expect(results.filter((r) => r.status === "processed"), JSON.stringify(results)).toHaveLength(1);
    expect(results.every((r) => ["processed", "duplicate"].includes(r.status))).toBe(true);

    const rental = await db.rental.findUniqueOrThrow({ where: { id: checkout.rentalId! } });
    expect(rental.status).toBe("ACTIVE");
    expect(rental.version).toBe(1);
    expect(rental.endsAt!.getTime() - rental.startsAt!.getTime()).toBe(60 * 60_000);
    expect(await db.commission.count({ where: { orderId: order.id } })).toBe(1);
  });

  it("rejects bad signatures and amount mismatches", async () => {
    const checkout = await createRentalCheckout(userId, { planId });
    const payment = await db.payment.findFirstOrThrow({ where: { orderId: checkout.orderId } });
    const good = mockProvider.signEvent({ id: `evt_sig_${tag}`, event: "payment.captured", order_id: payment.providerOrderId, amount: payment.amountMinor });
    expect((await processProviderWebhook("mock", good.raw, "deadbeef", new Headers())).status).toBe("rejected");

    const wrong = mockProvider.signEvent({ id: `evt_amt_${tag}`, event: "payment.captured", order_id: payment.providerOrderId, amount: 1 });
    expect(await processProviderWebhook("mock", wrong.raw, wrong.signature, new Headers())).toEqual({ status: "rejected", detail: "amount_mismatch" });
    expect((await db.order.findUniqueOrThrow({ where: { id: checkout.orderId } })).status).toBe("PENDING");
  });

  it("applies concurrent extensions without losing time", async () => {
    const checkout = await createRentalCheckout(userId, { planId });
    await payOrder(checkout.orderId);
    const before = await db.rental.findUniqueOrThrow({ where: { id: checkout.rentalId! } });
    const ext1 = await createExtensionCheckout(userId, { rentalId: before.id, planId });
    const ext2 = await createExtensionCheckout(userId, { rentalId: before.id, planId: planDayId });
    await Promise.all([payOrder(ext1.orderId), payOrder(ext2.orderId)]);
    const after = await db.rental.findUniqueOrThrow({ where: { id: before.id } });
    expect(after.endsAt!.getTime() - before.endsAt!.getTime()).toBe((60 + 1440) * 60_000);
    expect(after.version).toBe(3);
  });

  it("enforces usage limits atomically under concurrency", async () => {
    const checkout = await createRentalCheckout(userId, { planId });
    await payOrder(checkout.orderId);
    const attempts = await Promise.allSettled(Array.from({ length: 10 }, () => recordUsage(userId, checkout.rentalId!, 1, "request")));
    expect(attempts.filter((a) => a.status === "fulfilled")).toHaveLength(5);
    const rental = await db.rental.findUniqueOrThrow({ where: { id: checkout.rentalId! } });
    expect(rental.usageCount).toBe(5);
  });

  it("denies access once the server clock passes endsAt (and persists expiry)", async () => {
    const checkout = await createRentalCheckout(userId, { planId });
    await payOrder(checkout.orderId);
    const now = await authorizeRentalAccess(userId, checkout.rentalId!);
    expect(now.decision.ok).toBe(true);
    const later = await authorizeRentalAccess(userId, checkout.rentalId!, new Date(Date.now() + 61 * 60_000));
    expect(later.decision).toEqual({ ok: false, reason: "expired" });
    expect((await db.rental.findUniqueOrThrow({ where: { id: checkout.rentalId! } })).status).toBe("EXPIRED");
    await expect(recordUsage(userId, checkout.rentalId!, 1, "x", new Date(Date.now() + 61 * 60_000))).rejects.toThrow(/expired|not active/);
  });

  it("does not let another user access a rental", async () => {
    const other = await makeUser("intruder");
    const checkout = await createRentalCheckout(userId, { planId });
    await expect(authorizeRentalAccess(other, checkout.rentalId!)).rejects.toThrow(/not found/i);
  });

  it("refunds automatically when capacity fills before activation", async () => {
    await db.service.update({ where: { id: serviceId }, data: { capacity: null } });
    const u1 = await makeUser("cap1");
    const u2 = await makeUser("cap2");
    const a = await createRentalCheckout(u1, { planId: planDayId });
    const b = await createRentalCheckout(u2, { planId: planDayId });
    const live = await db.rental.count({ where: { serviceId, status: "ACTIVE", endsAt: { gt: new Date() } } });
    await db.service.update({ where: { id: serviceId }, data: { capacity: live + 1 } });
    await Promise.all([payOrder(a.orderId), payOrder(b.orderId)]);
    const statuses = (await db.rental.findMany({ where: { id: { in: [a.rentalId!, b.rentalId!] } } })).map((r) => r.status).sort();
    expect(statuses).toEqual(["ACTIVE", "REFUNDED"]);
    await db.service.update({ where: { id: serviceId }, data: { capacity: null } });
  });

  it("holds credits at checkout and releases them when payment fails", async () => {
    const u = await makeUser("credits");
    await db.creditLedger.create({ data: { userId: u, delta: 100, reason: "grant", refType: "test", refId: u } });
    const checkout = await createRentalCheckout(u, { planId: planDayId, useCredits: true });
    const order = await db.order.findUniqueOrThrow({ where: { id: checkout.orderId } });
    expect(order.creditsApplied).toBe(100);
    expect(await creditBalance(u)).toBe(0);
    const payment = await db.payment.findFirstOrThrow({ where: { orderId: order.id } });
    const fail = mockProvider.signEvent({ id: `evt_fail_${u}`, event: "payment.failed", order_id: payment.providerOrderId, amount: payment.amountMinor, reason: "declined" });
    expect((await processProviderWebhook("mock", fail.raw, fail.signature, new Headers())).status).toBe("processed");
    expect(await creditBalance(u)).toBe(100);
    expect((await db.rental.findUniqueOrThrow({ where: { id: checkout.rentalId! } })).status).toBe("PENDING_PAYMENT");
  });

  it("enforces the concurrent-rental entitlement of the Free plan", async () => {
    const u = await makeUser("free");
    const c = await createRentalCheckout(u, { planId });
    await payOrder(c.orderId);
    await expect(createRentalCheckout(u, { planId })).rejects.toThrow(/allows 1 active rental/);
  });
});

describe("subscriptions", () => {
  it("activates a paid plan, grants credits once, and handles failed renewal with grace", async () => {
    const u = await makeUser("member");
    const res = await startSubscriptionChange(u, { planCode: "STARTER", interval: "MONTHLY" });
    expect(res.kind).toBe("requires_payment");
    if (res.kind !== "requires_payment") return;
    await payOrder(res.orderId);
    await payOrder(res.orderId); // replay with a new event id → order already settled
    expect(await creditBalance(u)).toBe(300);

    const sub = await db.subscription.findUniqueOrThrow({ where: { userId: u } });
    await db.subscription.update({ where: { id: sub.id }, data: { currentPeriodEnd: new Date(Date.now() - 1000), simulateRenewalFailure: true } });
    await runBillingCycle();
    const pastDue = await db.subscription.findUniqueOrThrow({ where: { userId: u } });
    expect(pastDue.status).toBe("PAST_DUE");
    expect(pastDue.graceUntil!.getTime()).toBeGreaterThan(Date.now());

    await db.subscription.update({ where: { id: sub.id }, data: { simulateRenewalFailure: false } });
    await runBillingCycle();
    const recovered = await db.subscription.findUniqueOrThrow({ where: { userId: u } });
    expect(recovered.status).toBe("ACTIVE");
    expect(await creditBalance(u)).toBe(600);
  });

  it("schedules downgrades for period end instead of charging", async () => {
    const u = await makeUser("downgrade");
    const up = await startSubscriptionChange(u, { planCode: "PRO", interval: "MONTHLY" });
    if (up.kind === "requires_payment") await payOrder(up.orderId);
    const down = await startSubscriptionChange(u, { planCode: "STARTER", interval: "MONTHLY" });
    expect(down.kind).toBe("scheduled");
    const sub = await db.subscription.findUniqueOrThrow({ where: { userId: u }, include: { plan: true, scheduledPlan: true } });
    expect(sub.plan.code).toBe("PRO");
    expect(sub.scheduledPlan?.code).toBe("STARTER");
  });
});
