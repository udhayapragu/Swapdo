import { z } from "zod";
import { db } from "@/lib/db";
import { handler, json, notFound, parseBody } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

export const PATCH = handler(async (req, { params }: { params: Promise<{ key: string }> }) => {
  const admin = await requireAdmin();
  const { key } = await params;
  const { enabled } = await parseBody(req, z.object({ enabled: z.boolean() }));
  const res = await db.featureFlag.updateMany({ where: { key }, data: { enabled } });
  if (!res.count) throw notFound("Unknown flag.");
  await audit({ actorId: admin.id, action: "flag.update", entityType: "FeatureFlag", entityId: key, metadata: { enabled } });
  return json({ ok: true });
});
