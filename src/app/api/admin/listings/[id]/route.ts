import { db } from "@/lib/db";
import { badRequest, clientIp, handler, json, notFound, parseBody } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/session";
import { adminDecisionSchema } from "@/lib/validation";
import { audit, notify } from "@/lib/audit";

export const POST = handler(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin();
  const { id } = await params;
  const { decision, notes } = await parseBody(req, adminDecisionSchema);
  const service = await db.service.findUnique({ where: { id }, include: { seller: true, authorization: true } });
  if (!service) throw notFound("Listing not found.");
  if (decision === "approve") {
    if (service.seller.status !== "APPROVED") throw badRequest("The seller isn't approved.");
    if (!service.authorization || service.authorization.status !== "APPROVED") throw badRequest("The listing has no approved authorization — it can't go live.");
  }
  const status = decision === "approve" ? "APPROVED" : decision === "reject" ? "REJECTED" : "SUSPENDED";
  await db.$transaction(async (tx) => {
    await tx.service.update({ where: { id }, data: { status, moderationNotes: notes } });
    await notify(service.seller.userId, { kind: "listing", title: `Listing ${status.toLowerCase()}: ${service.name}`, body: notes || (status === "APPROVED" ? "It's now live in the marketplace." : "See moderation notes in your seller studio."), href: "/seller/listings" }, tx);
    await audit({ actorId: admin.id, action: `listing.${decision}`, entityType: "Service", entityId: id, metadata: { notes }, ip: clientIp(req) }, tx);
  });
  return json({ ok: true });
});
