import { describe, expect, it } from "vitest";
import { commissionSplit, prorationCredit, quote } from "@/lib/pricing";

describe("pricing", () => {
  it("applies membership discount, promo, then credits capped by share", () => {
    const q = quote({ basePriceMinor: 100000, membershipDiscountBps: 1200, promoPercentOff: 10, creditsAvailable: 10000, useCredits: true, maxCreditShare: 0.5 });
    // 1000.00 → -120 (12%) → 880 → -88 (10%) → 792 → credits up to 50% = 396
    expect(q).toEqual({ subtotalMinor: 100000, discountMinor: 20800, creditsApplied: 396, totalMinor: 39600 });
  });

  it("never applies more credits than available", () => {
    const q = quote({ basePriceMinor: 50000, membershipDiscountBps: 0, creditsAvailable: 30, useCredits: true, maxCreditShare: 0.5 });
    expect(q.creditsApplied).toBe(30);
    expect(q.totalMinor).toBe(47000);
  });

  it("ignores credits when not requested", () => {
    expect(quote({ basePriceMinor: 4900, membershipDiscountBps: 0, creditsAvailable: 999, useCredits: false, maxCreditShare: 0.5 }).totalMinor).toBe(4900);
  });

  it("caps proration so totals never go negative", () => {
    const q = quote({ basePriceMinor: 10000, membershipDiscountBps: 0, prorationCreditMinor: 50000, creditsAvailable: 0, useCredits: false, maxCreditShare: 0 });
    expect(q.totalMinor).toBe(0);
  });

  it("computes proration of unused period", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const end = new Date("2026-01-31T00:00:00Z");
    expect(prorationCredit(30000, start, end, new Date("2026-01-16T00:00:00Z"))).toBe(15000);
    expect(prorationCredit(30000, start, end, new Date("2026-02-02T00:00:00Z"))).toBe(0);
  });

  it("splits commission", () => {
    expect(commissionSplit(10000, 1500)).toEqual({ commissionMinor: 1500, netMinor: 8500 });
  });
});
