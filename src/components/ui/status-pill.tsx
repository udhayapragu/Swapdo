import { Badge, type BadgeTone } from "./badge";
import { STATUS_LABEL, type EffectiveRentalStatus } from "@/lib/rentals/engine";

const TONE: Record<EffectiveRentalStatus, BadgeTone> = {
  PENDING_PAYMENT: "warning",
  ACTIVE: "success",
  EXPIRING_SOON: "gold",
  EXPIRED: "neutral",
  CANCELLED: "neutral",
  REFUNDED: "violet",
};

export function RentalStatusPill({ status }: { status: EffectiveRentalStatus }) {
  return (
    <Badge tone={TONE[status]}>
      {(status === "ACTIVE" || status === "EXPIRING_SOON") && <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-current" aria-hidden />}
      {STATUS_LABEL[status]}
    </Badge>
  );
}

const GENERIC: Record<string, BadgeTone> = {
  PAID: "success", CAPTURED: "success", APPROVED: "success", ACTIVE: "success", PROCESSED: "success", RESOLVED: "success", AVAILABLE: "success", PAID_OUT: "violet",
  PENDING: "warning", PENDING_REVIEW: "warning", REQUESTED: "warning", CREATED: "warning", OPEN: "warning", PAST_DUE: "warning",
  FAILED: "danger", REJECTED: "danger", SUSPENDED: "danger", CONFIRMED: "danger", REVERSED: "danger",
  REFUNDED: "violet", CANCELLED: "neutral", EXPIRED: "neutral", DRAFT: "neutral", DISMISSED: "neutral",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={GENERIC[status] ?? "neutral"}>{status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}</Badge>;
}
