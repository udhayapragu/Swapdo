import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { clientIp, conflict, handler, json, parseBody } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { ensureFreeSubscription } from "@/lib/subscriptions/entitlements";
import { audit, notify } from "@/lib/audit";

export const POST = handler(async (req) => {
  const ip = clientIp(req);
  rateLimit(`register:${ip}`, 5, 15 * 60_000);
  const body = await parseBody(req, registerSchema);
  const passwordHash = await hashPassword(body.password);
  let userId: string;
  try {
    userId = await db.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email: body.email, name: body.name, passwordHash } });
      await ensureFreeSubscription(user.id, tx);
      await notify(user.id, { kind: "welcome", title: "Welcome to SWAPDO", body: "Explore the marketplace and start your first rental.", href: "/marketplace" }, tx);
      await audit({ actorId: user.id, action: "user.register", entityType: "User", entityId: user.id, ip }, tx);
      return user.id;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") throw conflict("An account with this email already exists.");
    throw err;
  }
  await createSession(userId, { ip, userAgent: req.headers.get("user-agent") ?? undefined });
  return json({ ok: true }, { status: 201 });
});
