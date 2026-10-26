import { db } from "@/lib/db";
import { handler, json, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { rentalCheckoutSchema } from "@/lib/validation";
import { createRentalCheckout } from "@/lib/rentals/service";
import { effectiveStatus, remainingMs } from "@/lib/rentals/engine";

export const GET = handler(async () => {
  const user = await requireUser();
  const now = new Date();
  const rentals = await db.rental.findMany({
    where: { userId: user.id },
    include: { service: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return json({
    serverTime: now.toISOString(),
    rentals: rentals.map((r) => ({ id: r.id, service: r.service, status: effectiveStatus(r, now), startsAt: r.startsAt, endsAt: r.endsAt, remainingMs: remainingMs(r, now), usageCount: r.usageCount, usageLimit: r.usageLimit })),
  });
});

/** Start a rental checkout. The price is computed server-side from the plan id. */
export const POST = handler(async (req) => {
  const user = await requireUser();
  rateLimit(`checkout:${user.id}`, 20, 10 * 60_000);
  const body = await parseBody(req, rentalCheckoutSchema);
  const result = await createRentalCheckout(user.id, body);
  return json(result, { status: 201 });
});
