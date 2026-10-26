import { z } from "zod";
import { db } from "@/lib/db";
import { conflict, handler, json, parseBody } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

export const POST = handler(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin();
  const { id } = await params;
  const { decision } = await parseBody(req, z.object({ decision: z.enum(["pay", "reject"]) }));
  await db.$transaction(async (tx) => {
    const moved = await tx.payout.updateMany({ where: { id, status: { in: ["REQUESTED", "APPROVED"] } }, data: { status: decision === "pay" ? "PAID" : "REJECTED", processedAt: new Date(), notes: decision === "pay" ? "Marked paid (sandbox — no bank transfer executed)" : undefined } });
    if (!moved.count) throw conflict("This payout was already processed.");
    if (decision === "pay") await tx.commission.updateMany({ where: { payoutId: id }, data: { status: "PAID_OUT" } });
    else await tx.commission.updateMany({ where: { payoutId: id }, data: { payoutId: null } });
    await audit({ actorId: admin.id, action: `payout.${decision}`, entityType: "Payout", entityId: id }, tx);
  });
  return json({ ok: true });
});
