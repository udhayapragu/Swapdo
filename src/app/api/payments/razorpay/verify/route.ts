import { z } from "zod";
import { db } from "@/lib/db";
import { badRequest, handler, json, notFound, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";
import { razorpayProvider } from "@/lib/payments/razorpay";

const schema = z.object({ razorpay_order_id: z.string().max(64), razorpay_payment_id: z.string().max(64), razorpay_signature: z.string().max(256) });

/**
 * Browser confirmation after Razorpay Checkout. We only verify the signature
 * here and report status; fulfilment happens exclusively on the signed
 * `payment.captured` webhook, so a forged client callback can't grant access.
 * Requires live credentials — untested without them.
 */
export const POST = handler(async (req) => {
  const user = await requireUser();
  const body = await parseBody(req, schema);
  const payment = await db.payment.findUnique({ where: { providerOrderId: body.razorpay_order_id }, include: { order: true } });
  if (!payment || payment.order.userId !== user.id) throw notFound("Payment not found.");
  const valid = razorpayProvider.verifyCheckoutSignature({ providerOrderId: body.razorpay_order_id, providerPaymentId: body.razorpay_payment_id, signature: body.razorpay_signature });
  if (!valid) throw badRequest("Payment signature could not be verified.");
  return json({ verified: true, orderStatus: payment.order.status });
});
