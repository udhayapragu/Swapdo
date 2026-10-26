// Pure, deterministic rental-time logic. All callers pass the *server* clock;
// nothing here ever trusts a client-supplied time.
import type { RentalStatus } from "@prisma/client";
import { siteConfig } from "@/config/site";

export type EffectiveRentalStatus = RentalStatus | "EXPIRING_SOON";

export type RentalTimes = {
  status: RentalStatus;
  startsAt: Date | null;
  endsAt: Date | null;
  durationMinutes: number;
};

export const MINUTE = 60_000;

export function activationWindow(now: Date, durationMinutes: number) {
  return { startsAt: now, endsAt: new Date(now.getTime() + durationMinutes * MINUTE) };
}

/** Extensions stack on the remaining time, or restart from now if already lapsed. */
export function extendedEnd(currentEnd: Date | null, now: Date, minutes: number): Date {
  const base = currentEnd && currentEnd.getTime() > now.getTime() ? currentEnd : now;
  return new Date(base.getTime() + minutes * MINUTE);
}

export function remainingMs(r: Pick<RentalTimes, "endsAt">, now: Date): number {
  if (!r.endsAt) return 0;
  return Math.max(0, r.endsAt.getTime() - now.getTime());
}

export function effectiveStatus(r: RentalTimes, now: Date): EffectiveRentalStatus {
  if (r.status !== "ACTIVE") return r.status;
  const left = remainingMs(r, now);
  if (left <= 0) return "EXPIRED";
  const threshold = Math.max(siteConfig.expiringSoonMinutes * MINUTE, r.durationMinutes * MINUTE * siteConfig.expiringSoonRatio);
  // Never flag long rentals as "expiring soon" more than a day ahead.
  return left <= Math.min(threshold, 1440 * MINUTE) ? "EXPIRING_SOON" : "ACTIVE";
}

export type AccessDecision =
  | { ok: true; remainingMs: number }
  | { ok: false; reason: "not_active" | "expired" | "usage_exhausted" };

export function accessDecision(
  r: RentalTimes & { usageLimit: number | null; usageCount: number },
  now: Date,
): AccessDecision {
  if (r.status !== "ACTIVE") return { ok: false, reason: r.status === "EXPIRED" ? "expired" : "not_active" };
  const left = remainingMs(r, now);
  if (left <= 0) return { ok: false, reason: "expired" };
  if (r.usageLimit !== null && r.usageCount >= r.usageLimit) return { ok: false, reason: "usage_exhausted" };
  return { ok: true, remainingMs: left };
}

export function progress(r: RentalTimes, now: Date): number {
  if (!r.startsAt || !r.endsAt) return 0;
  const total = r.endsAt.getTime() - r.startsAt.getTime();
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, (now.getTime() - r.startsAt.getTime()) / total));
}

export const STATUS_LABEL: Record<EffectiveRentalStatus, string> = {
  PENDING_PAYMENT: "Pending payment",
  ACTIVE: "Active",
  EXPIRING_SOON: "Expiring soon",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};
