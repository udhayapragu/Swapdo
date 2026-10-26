import { z } from "zod";
import { db } from "@/lib/db";
import { handler, json, parseBody } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

export const PATCH = handler(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin();
  const { id } = await params;
  const { active } = await parseBody(req, z.object({ active: z.boolean() }));
  await db.promoCode.update({ where: { id }, data: { active } });
  await audit({ actorId: admin.id, action: "promo.update", entityType: "PromoCode", entityId: id, metadata: { active } });
  return json({ ok: true });
});
