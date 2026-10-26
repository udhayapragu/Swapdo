import { handler, json, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";
import { recordUsage } from "@/lib/rentals/service";
import { usageSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export const POST = handler(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  rateLimit(`usage:${user.id}`, 120, 60_000);
  const { id } = await params;
  const body = await parseBody(req, usageSchema);
  await recordUsage(user.id, id, body.units, body.action);
  return json({ ok: true });
});
