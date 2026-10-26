import { db } from "@/lib/db";
import { ApiError, clientIp, handler, json, parseBody } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

// Unknown emails still pay the bcrypt cost, limiting account enumeration by timing.
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= hashPassword("swapdo-timing-equaliser"));

export const POST = handler(async (req) => {
  const ip = clientIp(req);
  rateLimit(`login:${ip}`, 10, 10 * 60_000);
  const body = await parseBody(req, loginSchema);
  rateLimit(`login:${body.email}`, 8, 10 * 60_000);
  const user = await db.user.findUnique({ where: { email: body.email } });
  const ok = await verifyPassword(body.password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !ok) throw new ApiError(401, "invalid_credentials", "Email or password is incorrect.");
  if (user.status !== "ACTIVE") throw new ApiError(403, "suspended", "This account is suspended. Contact support for help.");
  await createSession(user.id, { ip, userAgent: req.headers.get("user-agent") ?? undefined });
  await audit({ actorId: user.id, action: "user.login", entityType: "User", entityId: user.id, ip });
  return json({ ok: true, role: user.role });
});
