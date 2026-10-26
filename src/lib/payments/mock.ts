// Sandbox provider: simulates a gateway end-to-end (signed webhooks included)
// without moving money. Every payment it creates is marked sandbox.
import { randomBytes } from "node:crypto";
import type { NormalizedPaymentEvent, PaymentProvider } from "./types";
import { hmacSha256Hex, verifyHmac } from "./crypto";

const secret = () => process.env.MOCK_WEBHOOK_SECRET || "dev_mock_webhook_secret_change_me";

export type MockWebhookBody = {
  id: string;
  event: "payment.captured" | "payment.failed" | "refund.processed";
  order_id: string;
  payment_id?: string;
  amount: number;
  reason?: string;
};

export const mockProvider: PaymentProvider & {
  signEvent(body: MockWebhookBody): { raw: string; signature: string };
} = {
  name: "mock",
  sandbox: true,
  async createPayment({ amountMinor, currency }) {
    const providerOrderId = `mock_order_${randomBytes(9).toString("hex")}`;
    return { providerOrderId, clientPayload: { provider: "mock", providerOrderId, amountMinor, currency } };
  },
  verifyCheckoutSignature({ providerOrderId, providerPaymentId, signature }) {
    return verifyHmac(secret(), `${providerOrderId}|${providerPaymentId}`, signature);
  },
  verifyWebhookSignature(rawBody, signature) {
    return verifyHmac(secret(), rawBody, signature);
  },
  parseWebhook(rawBody): NormalizedPaymentEvent {
    const body = JSON.parse(rawBody) as MockWebhookBody;
    return {
      eventId: body.id,
      type: body.event,
      providerOrderId: body.order_id,
      providerPaymentId: body.payment_id,
      amountMinor: body.amount,
      reason: body.reason,
    };
  },
  async refund() {
    return { providerRefundId: `mock_rfnd_${randomBytes(8).toString("hex")}` };
  },
  signEvent(body) {
    const raw = JSON.stringify(body);
    return { raw, signature: hmacSha256Hex(secret(), raw) };
  },
};
