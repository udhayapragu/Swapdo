import { describe, expect, it } from "vitest";
import { accessDecision, activationWindow, effectiveStatus, extendedEnd, progress, remainingMs } from "@/lib/rentals/engine";

const t0 = new Date("2026-01-01T10:00:00Z");
const at = (min: number) => new Date(t0.getTime() + min * 60_000);

describe("rental engine", () => {
  it("computes the activation window from the server clock", () => {
    const w = activationWindow(t0, 180);
    expect(w.startsAt).toEqual(t0);
    expect(w.endsAt).toEqual(at(180));
  });

  it("stacks extensions on remaining time and restarts lapsed rentals from now", () => {
    expect(extendedEnd(at(30), t0, 60)).toEqual(at(90));
    expect(extendedEnd(at(-30), t0, 60)).toEqual(at(60));
    expect(extendedEnd(null, t0, 60)).toEqual(at(60));
  });

  it("derives Active / Expiring soon / Expired", () => {
    const r = { status: "ACTIVE" as const, startsAt: t0, endsAt: at(60), durationMinutes: 60 };
    expect(effectiveStatus(r, at(10))).toBe("ACTIVE");
    expect(effectiveStatus(r, at(50))).toBe("EXPIRING_SOON");
    expect(effectiveStatus(r, at(60))).toBe("EXPIRED");
    expect(effectiveStatus({ ...r, status: "REFUNDED" }, at(10))).toBe("REFUNDED");
  });

  it("does not flag long rentals as expiring days in advance", () => {
    const year = { status: "ACTIVE" as const, startsAt: t0, endsAt: at(525600), durationMinutes: 525600 };
    expect(effectiveStatus(year, at(525600 - 2 * 1440))).toBe("ACTIVE");
    expect(effectiveStatus(year, at(525600 - 600))).toBe("EXPIRING_SOON");
  });

  it("denies access when expired, inactive or out of usage", () => {
    const base = { status: "ACTIVE" as const, startsAt: t0, endsAt: at(60), durationMinutes: 60, usageLimit: 5, usageCount: 0 };
    expect(accessDecision(base, at(1))).toEqual({ ok: true, remainingMs: 59 * 60_000 });
    expect(accessDecision(base, at(61))).toEqual({ ok: false, reason: "expired" });
    expect(accessDecision({ ...base, usageCount: 5 }, at(1))).toEqual({ ok: false, reason: "usage_exhausted" });
    expect(accessDecision({ ...base, status: "PENDING_PAYMENT" }, at(1))).toEqual({ ok: false, reason: "not_active" });
  });

  it("reports remaining time and progress", () => {
    const r = { status: "ACTIVE" as const, startsAt: t0, endsAt: at(100), durationMinutes: 100 };
    expect(remainingMs(r, at(25))).toBe(75 * 60_000);
    expect(progress(r, at(25))).toBeCloseTo(0.25);
    expect(remainingMs(r, at(200))).toBe(0);
  });
});
