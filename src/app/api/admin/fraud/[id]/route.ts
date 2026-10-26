import { z } from "zod";
import { db } from "@/lib/db";
import { handler, json, parseBody } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

export const PATCH = handler(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin();
  const { id } = await params;
  const { status } = await parseBody(req, z.object({ status: z.enum(["DISMISSED", "CONFIRMED"]) }));
  await db.fraudFlag.update({ where: { id }, data: { status } });
  await audit({ actorId: admin.id, action: "fraud.review", entityType: "FraudFlag", entityId: id, metadata: { status } });
  return json({ ok: true });
});
