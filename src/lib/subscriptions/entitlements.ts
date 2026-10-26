import type { Prisma, SubscriptionPlan } from "@prisma/client";
import { db } from "../db";

type Tx = Prisma.TransactionClient | typeof db;

export type Entitlements = {
  plan: SubscriptionPlan;
  /** Whether a paid plan is currently in force (active or within grace). */
  paid: boolean;
  inGrace: boolean;
};

export async function getFreePlan(tx: Tx = db) {
  const plan = await tx.subscriptionPlan.findUnique({ where: { code: "FREE" } });
  if (!plan) throw new Error("FREE plan missing — run the seed script.");
  return plan;
}

export async function getEntitlements(userId: string, now = new Date(), tx: Tx = db): Promise<Entitlements> {
  const sub = await tx.subscription.findUnique({ where: { userId }, include: { plan: true } });
  if (sub) {
    const inForce = sub.status === "ACTIVE" && (!sub.currentPeriodEnd || sub.currentPeriodEnd > now);
    const inGrace = sub.status === "PAST_DUE" && !!sub.graceUntil && sub.graceUntil > now;
    if (inForce || inGrace) return { plan: sub.plan, paid: sub.plan.code !== "FREE", inGrace };
  }
  return { plan: await getFreePlan(tx), paid: false, inGrace: false };
}

export async function ensureFreeSubscription(userId: string, tx: Tx = db) {
  const free = await getFreePlan(tx);
  await tx.subscription.upsert({
    where: { userId },
    update: {},
    create: { userId, planId: free.id, status: "ACTIVE", currentPeriodStart: new Date() },
  });
}
