import { db } from "@/lib/db";
import { handler, json, notFound } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";

type Ctx = { params: Promise<{ serviceId: string }> };

export const POST = handler(async (_req, { params }: Ctx) => {
  const user = await requireUser();
  const { serviceId } = await params;
  const exists = await db.service.count({ where: { id: serviceId, status: "APPROVED" } });
  if (!exists) throw notFound("Service not found.");
  await db.favorite.upsert({ where: { userId_serviceId: { userId: user.id, serviceId } }, update: {}, create: { userId: user.id, serviceId } });
  return json({ favorite: true });
});

export const DELETE = handler(async (_req, { params }: Ctx) => {
  const user = await requireUser();
  const { serviceId } = await params;
  await db.favorite.deleteMany({ where: { userId: user.id, serviceId } });
  return json({ favorite: false });
});
