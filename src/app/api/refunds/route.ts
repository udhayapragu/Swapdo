import { db } from "@/lib/db";
import { badRequest, conflict, handler, json, notFound, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";
import { refundRequestSchema } from "@/lib/validation";
import { getPlatformSettings } from "@/lib/settings";
import { audit } from "@/lib/audit";

export const POST = handler(async (req) => {
  const user = await requireUser();
  const body = await parseBody(req, refundRequestSchema);
  const order = await db.order.findUnique({ where: { id: body.orderId }, include: { refunds: true } });
  if (!order || order.userId !== user.id) throw notFound("Order not found.");
  if (order.status !== "PAID") throw badRequest("Only paid orders can be refunded.");
  if (order.refunds.some((r) => r.status !== "REJECTED")) throw conflict("A refund has already been requested for this order.");
  const { refundWindowHours } = await getPlatformSettings();
  if (order.paidAt && Date.now() - order.paidAt.getTime() > refundWindowHours * 3600_000) {
    throw badRequest("This order is outside the refund window. Contact support if something went wrong.");
  }
  const refund = await db.refund.create({ data: { orderId: order.id, amountMinor: order.totalMinor, reason: body.reason, requestedById: user.id } });
  await audit({ actorId: user.id, action: "refund.request", entityType: "Refund", entityId: refund.id });
  return json({ ok: true, refundId: refund.id }, { status: 201 });
});
