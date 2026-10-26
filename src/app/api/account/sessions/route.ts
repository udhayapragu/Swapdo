import { db } from "@/lib/db";
import { handler, json } from "@/lib/http";
import { requireUser, destroySession } from "@/lib/auth/session";

/** Sign out everywhere. */
export const DELETE = handler(async () => {
  const user = await requireUser();
  await db.session.deleteMany({ where: { userId: user.id } });
  await destroySession();
  return json({ ok: true });
});
