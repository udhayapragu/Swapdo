// Server-side price computation. Client-supplied prices are never used.
import { applyBps } from "./money";

export const CREDIT_VALUE_MINOR = 100; // 1 credit = ₹1

export type QuoteInput = {
  basePriceMinor: number;
  membershipDiscountBps: number;
  promoPercentOff?: number | null;
  prorationCreditMinor?: number;
  creditsAvailable: number;
  useCredits: boolean;
  maxCreditShare: number;
};

export type Quote = {
  subtotalMinor: number;
  discountMinor: number;
  creditsApplied: number;
  totalMinor: number;
};

export function quote(input: QuoteInput): Quote {
  const subtotal = Math.max(0, Math.round(input.basePriceMinor));
  const membership = applyBps(subtotal, Math.max(0, input.membershipDiscountBps));
  const afterMembership = subtotal - membership;
  const promo = input.promoPercentOff ? Math.round((afterMembership * Math.min(100, input.promoPercentOff)) / 100) : 0;
  const proration = Math.min(Math.max(0, input.prorationCreditMinor ?? 0), afterMembership - promo);
  const discount = membership + promo + proration;
  const afterDiscounts = subtotal - discount;

  let creditsApplied = 0;
  if (input.useCredits && input.creditsAvailable > 0 && afterDiscounts > 0) {
    const maxByShare = Math.floor((afterDiscounts * input.maxCreditShare) / CREDIT_VALUE_MINOR);
    creditsApplied = Math.max(0, Math.min(input.creditsAvailable, maxByShare));
  }
  return {
    subtotalMinor: subtotal,
    discountMinor: discount,
    creditsApplied,
    totalMinor: afterDiscounts - creditsApplied * CREDIT_VALUE_MINOR,
  };
}

/** Value of the unused part of a paid period, used when upgrading mid-cycle. */
export function prorationCredit(paidMinor: number, periodStart: Date, periodEnd: Date, now: Date): number {
  const total = periodEnd.getTime() - periodStart.getTime();
  const left = periodEnd.getTime() - now.getTime();
  if (total <= 0 || left <= 0) return 0;
  return Math.floor((paidMinor * left) / total);
}

export function commissionSplit(grossMinor: number, rateBps: number) {
  const commissionMinor = applyBps(grossMinor, rateBps);
  return { commissionMinor, netMinor: grossMinor - commissionMinor };
}
