import type { PaymentProvider } from "./types";
import { mockProvider } from "./mock";
import { razorpayProvider } from "./razorpay";

export function getPaymentProvider(name?: string): PaymentProvider {
  const selected = name ?? process.env.PAYMENT_PROVIDER ?? "mock";
  if (selected === "razorpay") return razorpayProvider;
  return mockProvider;
}

export const isSandboxPayments = () => getPaymentProvider().sandbox;
