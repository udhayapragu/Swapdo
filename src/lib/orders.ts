import { randomBytes } from "node:crypto";
import type { OrderPurpose, Prisma, BillingInterval } from "@prisma/client";
import { getPaymentProvider } from "./payments";
import { db } from "./db";
import type { Quote } from "./pricing";

type Tx = Prisma.TransactionClient;

export function orderNumber(now = new Date()): string {
  const d = now.toISOString().slice(0, 10).replace(/-/g, "");
  return `SWP-${d}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function createOrder(
  tx: Tx,
  data: {
    userId: string;
    purpose: OrderPurpose;
    description: string;
    quote: Quote;
    rentalId?: string;
    extendMinutes?: number;
    subscriptionPlanCode?: string;
    billingInterval?: BillingInterval;
    promoCodeId?: string | null;
  },
) {
  return tx.order.create({
    data: {
      number: orderNumber(),
      userId: data.userId,
      purpose: data.purpose,
      description: data.description,
      subtotalMinor: data.quote.subtotalMinor,
      discountMinor: data.quote.discountMinor,
      creditsApplied: data.quote.creditsApplied,
      totalMinor: data.quote.totalMinor,
      rentalId: data.rentalId,
      extendMinutes: data.extendMinutes,
      subscriptionPlanCode: data.subscriptionPlanCode,
      billingInterval: data.billingInterval,
      promoCodeId: data.promoCodeId ?? undefined,
    },
  });
}

/** Opens a payment attempt with the configured provider for a pending order. */
export async function openPaymentAttempt(tx: Tx | typeof db, order: { id: string; number: string; totalMinor: number; currency: string }) {
  const provider = getPaymentProvider();
  const created = await provider.createPayment({
    orderId: order.id,
    orderNumber: order.number,
    amountMinor: order.totalMinor,
    currency: order.currency,
  });
  return tx.payment.create({
    data: {
      orderId: order.id,
      provider: provider.name,
      providerOrderId: created.providerOrderId,
      amountMinor: order.totalMinor,
      sandbox: provider.sandbox,
    },
  });
}
