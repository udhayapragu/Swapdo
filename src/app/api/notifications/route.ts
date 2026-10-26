import { db } from "@/lib/db";
import { handler, json } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";

export const GET = handler(async () => {
  const user = await requireUser();
  const items = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });
  return json({ notifications: items, unread: items.filter((n) => !n.readAt).length });
});

/** Mark all as read. */
export const PATCH = handler(async () => {
  const user = await requireUser();
  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  return json({ ok: true });
});
