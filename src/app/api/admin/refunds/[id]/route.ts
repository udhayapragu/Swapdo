import { z } from "zod";
import { db } from "@/lib/db";
import { conflict, handler, json, parseBody } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/session";
import { processRefund } from "@/lib/payments/fulfillment";
import { audit } from "@/lib/audit";

export const POST = handler(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin();
  const { id } = await params;
  const { decision, notes } = await parseBody(req, z.object({ decision: z.enum(["approve", "reject"]), notes: z.string().max(500).optional() }));
  if (decision === "approve") {
    const res = await processRefund(id, admin.id);
    if (!res.ok) throw conflict("This refund can't be processed.");
  } else {
    const moved = await db.refund.updateMany({ where: { id, status: "REQUESTED" }, data: { status: "REJECTED", reviewedById: admin.id, reviewNotes: notes } });
    if (!moved.count) throw conflict("This refund was already reviewed.");
    await audit({ actorId: admin.id, action: "refund.reject", entityType: "Refund", entityId: id, metadata: { notes } });
  }
  return json({ ok: true });
});
