import { z } from "zod";
import { db } from "@/lib/db";
import { handler, json, parseBody } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

export const PATCH = handler(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin();
  const { id } = await params;
  const { status } = await parseBody(req, z.object({ status: z.enum(["OPEN", "PENDING", "RESOLVED"]) }));
  await db.supportTicket.update({ where: { id }, data: { status } });
  await audit({ actorId: admin.id, action: "ticket.update", entityType: "SupportTicket", entityId: id, metadata: { status } });
  return json({ ok: true });
});
