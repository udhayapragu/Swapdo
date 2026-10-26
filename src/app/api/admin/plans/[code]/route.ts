import { z } from "zod";
import { db } from "@/lib/db";
import { handler, json, parseBody } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

const schema = z.object({
  monthlyPriceMinor: z.number().int().min(0).max(100_000_000),
  annualPriceMinor: z.number().int().min(0).max(1_000_000_000),
  monthlyCredits: z.number().int().min(0).max(1_000_000),
  maxConcurrentRentals: z.number().int().min(1).max(1000),
  rentalDiscountBps: z.number().int().min(0).max(5000),
  active: z.boolean(),
});

export const PATCH = handler(async (req, { params }: { params: Promise<{ code: string }> }) => {
  const admin = await requireAdmin();
  const { code } = await params;
  const body = await parseBody(req, schema);
  await db.subscriptionPlan.update({ where: { code }, data: { ...body, active: code === "FREE" ? true : body.active } });
  await audit({ actorId: admin.id, action: "plan.update", entityType: "SubscriptionPlan", entityId: code, metadata: body });
  return json({ ok: true });
});
