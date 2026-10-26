import { forbidden, handler, json } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";
import { authorizeRentalAccess, issueAccessGrant } from "@/lib/rentals/service";
import { rateLimit } from "@/lib/rate-limit";

const REASONS = {
  expired: "This rental has expired. Renew to regain access.",
  not_active: "This rental isn't active yet.",
  usage_exhausted: "All included usage has been consumed. Extend your rental to continue.",
} as const;

/** Every launch of a rented service passes through this server-side check. */
export const POST = handler(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  rateLimit(`access:${user.id}`, 60, 60_000);
  const { id } = await params;
  const now = new Date();
  const { rental, decision } = await authorizeRentalAccess(user.id, id, now);
  if (!decision.ok) throw forbidden(REASONS[decision.reason]);
  const grant = issueAccessGrant(rental, now);
  return json({
    granted: true,
    serverTime: now.toISOString(),
    endsAt: rental.endsAt,
    accessMethod: rental.service.accessMethod,
    simulated: rental.service.isDemo,
    grant,
  });
});
