import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { badRequest, conflict, forbidden, handler, json, notFound, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";
import { mockPaymentSchema } from "@/lib/validation";
import { mockProvider } from "@/lib/payments/mock";
import { getPaymentProvider } from "@/lib/payments";
import { processProviderWebhook } from "@/lib/payments/fulfillment";
import { rateLimit } from "@/lib/rate-limit";

/**
 * SANDBOX ONLY. Simulates the gateway: it signs a webhook event exactly as a
 * provider would and feeds it through the real webhook processor, so the
 * verification, idempotency and fulfilment code paths are all exercised.
 */
export const POST = handler(async (req) => {
  if (getPaymentProvider().name !== "mock") throw forbidden("Sandbox payments are disabled.");
  const user = await requireUser();
  rateLimit(`mockpay:${user.id}`, 30, 60_000);
  const { orderId, outcome } = await parseBody(req, mockPaymentSchema);
  const order = await db.order.findUnique({ where: { id: orderId }, include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } } });
  if (!order || order.userId !== user.id) throw notFound("Order not found.");
  if (order.status !== "PENDING") throw conflict(`This order is already ${order.status.toLowerCase()}.`);
  const payment = order.payments[0];
  if (!payment || payment.status !== "CREATED") throw badRequest("No open payment attempt for this order.");

  const eventId = `evt_${randomBytes(10).toString("hex")}`;
  const { raw, signature } = mockProvider.signEvent(
    outcome === "success"
      ? { id: eventId, event: "payment.captured", order_id: payment.providerOrderId, payment_id: `mock_pay_${randomBytes(9).toString("hex")}`, amount: payment.amountMinor }
      : { id: eventId, event: "payment.failed", order_id: payment.providerOrderId, amount: payment.amountMinor, reason: "Card declined (sandbox simulation)" },
  );
  const result = await processProviderWebhook("mock", raw, signature, req.headers);
  const updated = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  return json({ result, order: { id: updated.id, status: updated.status, rentalId: updated.rentalId, purpose: updated.purpose } });
});
