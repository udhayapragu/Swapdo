import { z } from "zod";
import { db } from "@/lib/db";
import { handler, json, parseBody } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

export const PATCH = handler(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin();
  const { id } = await params;
  const body = await parseBody(req, z.object({ active: z.boolean().optional(), tagline: z.string().trim().min(3).max(120).optional() }));
  await db.category.update({ where: { id }, data: body });
  await audit({ actorId: admin.id, action: "category.update", entityType: "Category", entityId: id, metadata: body });
  return json({ ok: true });
});
