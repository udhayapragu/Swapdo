import { db } from "@/lib/db";
import { handler, json } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";
import { getEntitlements } from "@/lib/subscriptions/entitlements";
import { creditBalance } from "@/lib/credits";

export const GET = handler(async () => {
  const user = await requireUser();
  const [sub, ent, credits] = await Promise.all([
    db.subscription.findUnique({ where: { userId: user.id }, include: { plan: true, scheduledPlan: true } }),
    getEntitlements(user.id),
    creditBalance(user.id),
  ]);
  return json({ subscription: sub, entitlements: { plan: ent.plan.code, maxConcurrentRentals: ent.plan.maxConcurrentRentals, rentalDiscountBps: ent.plan.rentalDiscountBps, inGrace: ent.inGrace }, credits });
});
