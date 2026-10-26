import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, handler, json, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { registerSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

export const POST = handler(async (req) => {
  const user = await requireUser();
  rateLimit(`password:${user.id}`, 5, 15 * 60_000);
  const body = await parseBody(req, z.object({ current: z.string().min(1).max(128), next: registerSchema.shape.password }));
  const row = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(body.current, row.passwordHash))) throw new ApiError(400, "invalid_password", "Your current password is incorrect.");
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(body.next) } });
  await audit({ actorId: user.id, action: "user.password_change", entityType: "User", entityId: user.id });
  return json({ ok: true });
});
