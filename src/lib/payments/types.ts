export type NormalizedPaymentEvent = {
  eventId: string;
  type: "payment.captured" | "payment.failed" | "refund.processed" | "ignored";
  providerOrderId?: string;
  providerPaymentId?: string;
  amountMinor?: number;
  reason?: string;
};

export interface PaymentProvider {
  readonly name: "mock" | "razorpay";
  /** True when no real money moves. */
  readonly sandbox: boolean;
  createPayment(input: {
    orderId: string;
    orderNumber: string;
    amountMinor: number;
    currency: string;
  }): Promise<{ providerOrderId: string; clientPayload: Record<string, unknown> }>;
  /** Verifies the signature returned to the browser after checkout (Razorpay-style). */
  verifyCheckoutSignature(p: { providerOrderId: string; providerPaymentId: string; signature: string }): boolean;
  verifyWebhookSignature(rawBody: string, signature: string | null): boolean;
  parseWebhook(rawBody: string, headers: Headers): NormalizedPaymentEvent;
  refund(input: { providerPaymentId: string; amountMinor: number }): Promise<{ providerRefundId: string }>;
}
