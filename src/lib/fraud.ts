import type { Prisma } from "@prisma/client";
import { isFeatureEnabled } from "./settings";

type Tx = Prisma.TransactionClient;

/** Lightweight velocity heuristics. Flags are reviewed by admins; nothing is auto-blocked. */
export async function checkOrderVelocity(tx: Tx, userId: string, orderId: string, now = new Date()) {
  if (!(await isFeatureEnabled("fraud_auto_flag", tx))) return;
  const since = new Date(now.getTime() - 10 * 60_000);
  const recent = await tx.order.count({ where: { userId, createdAt: { gte: since } } });
  if (recent > 6) {
    await tx.fraudFlag.create({
      data: { userId, orderId, reason: `${recent} orders created in 10 minutes`, severity: recent > 12 ? "high" : "medium" },
    });
  }
}

export async function checkPaymentFailures(tx: Tx, userId: string, now = new Date()) {
  if (!(await isFeatureEnabled("fraud_auto_flag", tx))) return;
  const since = new Date(now.getTime() - 60 * 60_000);
  const failures = await tx.order.count({ where: { userId, status: "FAILED", updatedAt: { gte: since } } });
  if (failures === 4) {
    await tx.fraudFlag.create({ data: { userId, reason: "4 failed payments within an hour", severity: "medium" } });
  }
}
