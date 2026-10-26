import { z } from "zod";
import { db } from "@/lib/db";
import { badRequest, handler, json, notFound, parseBody } from "@/lib/http";
import { requireApprovedSeller } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

const schema = z.object({
  action: z.enum(["pause", "submit"]).optional(),
  plans: z.array(z.object({ id: z.string(), priceMinor: z.number().int().min(1000).max(100_000_000), active: z.boolean() })).max(7).optional(),
});

export const PATCH = handler(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireApprovedSeller();
  const { id } = await params;
  const body = await parseBody(req, schema);
  const service = await db.service.findUnique({ where: { id }, include: { plans: true } });
  if (!service || service.sellerId !== user.sellerId) throw notFound("Listing not found.");
  if (service.status === "SUSPENDED") throw badRequest("This listing was suspended by moderation. Contact support.");

  await db.$transaction(async (tx) => {
    if (body.action === "pause") await tx.service.update({ where: { id }, data: { status: "DRAFT" } });
    if (body.action === "submit") await tx.service.update({ where: { id }, data: { status: "PENDING_REVIEW" } });
    for (const p of body.plans ?? []) {
      if (!service.plans.some((sp) => sp.id === p.id)) throw badRequest("Unknown plan.");
      await tx.rentalPlan.update({ where: { id: p.id }, data: { priceMinor: p.priceMinor, active: p.active } });
    }
    await audit({ actorId: user.id, action: "listing.update", entityType: "Service", entityId: id, metadata: body }, tx);
  });
  return json({ ok: true });
});
