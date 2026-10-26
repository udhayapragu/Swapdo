import { z } from "zod";
import { db } from "@/lib/db";
import { handler, json, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";

export const PATCH = handler(async (req) => {
  const user = await requireUser();
  const { name } = await parseBody(req, z.object({ name: z.string().trim().min(2).max(80) }));
  await db.user.update({ where: { id: user.id }, data: { name } });
  return json({ ok: true });
});
