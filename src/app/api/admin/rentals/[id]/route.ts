import { db } from "@/lib/db";
import { conflict, handler, json } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/session";
import { audit, notify } from "@/lib/audit";

/** Force-end an active rental (e.g. abuse). Refunds are handled separately. */
export const DELETE = handler(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin();
  const { id } = await params;
  const now = new Date();
  const res = await db.rental.updateMany({ where: { id, status: "ACTIVE" }, data: { status: "EXPIRED", endsAt: now } });
  if (!res.count) throw conflict("Rental is not active.");
  const r = await db.rental.findUniqueOrThrow({ where: { id } });
  await notify(r.userId, { kind: "rental_expired", title: "Rental ended by SWAPDO", body: "Your rental was ended by our trust & safety team. Contact support for details." });
  await audit({ actorId: admin.id, action: "rental.force_end", entityType: "Rental", entityId: id });
  return json({ ok: true });
});
