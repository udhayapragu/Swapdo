import { z } from "zod";
import { db } from "@/lib/db";
import { handler, json, parseBody } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

const schema = z.object({
  commissionRateBps: z.number().int().min(0).max(5000).optional(),
  minimumPayoutMinor: z.number().int().min(0).max(100_000_000).optional(),
  refundWindowHours: z.number().int().min(0).max(24 * 90).optional(),
});

export const PATCH = handler(async (req) => {
  const admin = await requireAdmin();
  const body = await parseBody(req, schema);
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) continue;
    await db.platformSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
    await audit({ actorId: admin.id, action: "settings.update", entityType: "PlatformSetting", entityId: key, metadata: { value } });
  }
  return json({ ok: true });
});
