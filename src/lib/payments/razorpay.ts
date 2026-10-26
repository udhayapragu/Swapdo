// Razorpay adapter. Requires an approved merchant account and the
// RAZORPAY_* environment variables. It is NOT active unless
// PAYMENT_PROVIDER=razorpay, and has not been exercised against live keys.
import type { NormalizedPaymentEvent, PaymentProvider } from "./types";
import { verifyHmac } from "./crypto";

const API = "https://api.razorpay.com/v1";

function creds() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay credentials are not configured.");
  return { keyId, keySecret, auth: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64") };
}

type RazorpayWebhook = {
  event: string;
  payload: {
    payment?: { entity: { id: string; order_id: string; amount: number; error_description?: string } };
    refund?: { entity: { id: string; payment_id: string; amount: number } };
  };
};

export const razorpayProvider: PaymentProvider = {
  name: "razorpay",
  sandbox: (process.env.RAZORPAY_KEY_ID ?? "").startsWith("rzp_test_"),
  async createPayment({ orderNumber, amountMinor, currency }) {
    const { keyId, auth } = creds();
    const res = await fetch(`${API}/orders`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amountMinor, currency, receipt: orderNumber }),
    });
    if (!res.ok) throw new Error(`Razorpay order creation failed (${res.status})`);
    const data = (await res.json()) as { id: string };
    return { providerOrderId: data.id, clientPayload: { provider: "razorpay", key: keyId, order_id: data.id, amount: amountMinor, currency } };
  },
  verifyCheckoutSignature({ providerOrderId, providerPaymentId, signature }) {
    return verifyHmac(process.env.RAZORPAY_KEY_SECRET ?? "", `${providerOrderId}|${providerPaymentId}`, signature);
  },
  verifyWebhookSignature(rawBody, signature) {
    return verifyHmac(process.env.RAZORPAY_WEBHOOK_SECRET ?? "", rawBody, signature);
  },
  parseWebhook(rawBody, headers): NormalizedPaymentEvent {
    const body = JSON.parse(rawBody) as RazorpayWebhook;
    const eventId = headers.get("x-razorpay-event-id") ?? `${body.event}:${body.payload.payment?.entity.id ?? body.payload.refund?.entity.id}`;
    const p = body.payload.payment?.entity;
    if (body.event === "payment.captured" && p)
      return { eventId, type: "payment.captured", providerOrderId: p.order_id, providerPaymentId: p.id, amountMinor: p.amount };
    if (body.event === "payment.failed" && p)
      return { eventId, type: "payment.failed", providerOrderId: p.order_id, providerPaymentId: p.id, reason: p.error_description };
    if (body.event === "refund.processed" && body.payload.refund)
      return { eventId, type: "refund.processed", providerPaymentId: body.payload.refund.entity.payment_id, amountMinor: body.payload.refund.entity.amount };
    return { eventId, type: "ignored" };
  },
  async refund({ providerPaymentId, amountMinor }) {
    const { auth } = creds();
    const res = await fetch(`${API}/payments/${providerPaymentId}/refund`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amountMinor }),
    });
    if (!res.ok) throw new Error(`Razorpay refund failed (${res.status})`);
    return { providerRefundId: ((await res.json()) as { id: string }).id };
  },
};
