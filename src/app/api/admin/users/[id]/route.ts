import { z } from "zod";
import { db } from "@/lib/db";
import { badRequest, handler, json, parseBody } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

export const PATCH = handler(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin();
  const { id } = await params;
  if (id === admin.id) throw badRequest("You can't change your own account here.");
  const body = await parseBody(req, z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]).optional(), role: z.enum(["USER", "SELLER", "ADMIN"]).optional() }));
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: body });
    // Suspending a user immediately revokes all their sessions.
    if (body.status === "SUSPENDED") await tx.session.deleteMany({ where: { userId: id } });
    await audit({ actorId: admin.id, action: "user.update", entityType: "User", entityId: id, metadata: body }, tx);
  });
  return json({ ok: true });
});
