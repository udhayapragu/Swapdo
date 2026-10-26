import { db } from "@/lib/db";
import { handler, json, notFound } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";
import { cancelPendingRental } from "@/lib/rentals/service";
import { effectiveStatus, remainingMs } from "@/lib/rentals/engine";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async (_req, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const now = new Date();
  const r = await db.rental.findUnique({ where: { id }, include: { service: { select: { name: true, slug: true } }, plan: true } });
  if (!r || r.userId !== user.id) throw notFound("Rental not found.");
  return json({
    serverTime: now.toISOString(),
    rental: { id: r.id, service: r.service, status: effectiveStatus(r, now), startsAt: r.startsAt, endsAt: r.endsAt, remainingMs: remainingMs(r, now), usageCount: r.usageCount, usageLimit: r.usageLimit, usageUnit: r.plan.usageUnit },
  });
});

export const DELETE = handler(async (_req, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  await cancelPendingRental(user.id, id);
  return json({ ok: true });
});
