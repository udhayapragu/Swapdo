import { db } from "@/lib/db";
import { badRequest, handler, json } from "@/lib/http";
import { requireApprovedSeller } from "@/lib/auth/session";
import { getPlatformSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { audit } from "@/lib/audit";

/** Requests a payout of the full available balance. Serialised per seller via row lock. */
export const POST = handler(async () => {
  const user = await requireApprovedSeller();
  const { minimumPayoutMinor } = await getPlatformSettings();
  const payout = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Seller" WHERE id = ${user.sellerId} FOR UPDATE`;
    const available = await tx.commission.findMany({ where: { sellerId: user.sellerId, status: "AVAILABLE", payoutId: null } });
    const amount = available.reduce((a, c) => a + c.netMinor, 0);
    if (amount < minimumPayoutMinor) throw badRequest(`The minimum payout is ${formatMoney(minimumPayoutMinor)}. Available: ${formatMoney(amount)}.`);
    const payout = await tx.payout.create({ data: { sellerId: user.sellerId, amountMinor: amount } });
    await tx.commission.updateMany({ where: { id: { in: available.map((c) => c.id) } }, data: { payoutId: payout.id } });
    await audit({ actorId: user.id, action: "payout.request", entityType: "Payout", entityId: payout.id, metadata: { amount } }, tx);
    return payout;
  });
  return json({ ok: true, payoutId: payout.id, amountMinor: payout.amountMinor }, { status: 201 });
});
