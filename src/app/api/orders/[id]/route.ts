import { db } from "@/lib/db";
import { handler, json, notFound } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";

export const GET = handler(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  const order = await db.order.findUnique({ where: { id }, include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } } });
  if (!order || (order.userId !== user.id && user.role !== "ADMIN")) throw notFound("Order not found.");
  return json({ order: { id: order.id, number: order.number, status: order.status, totalMinor: order.totalMinor, purpose: order.purpose, rentalId: order.rentalId, paymentStatus: order.payments[0]?.status ?? null } });
});
