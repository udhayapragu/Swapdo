import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { conflict, forbidden, handler, json, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";
import { reviewSchema } from "@/lib/validation";

/** Only customers who actually rented the service may review it — one review each. */
export const POST = handler(async (req, { params }: { params: Promise<{ serviceId: string }> }) => {
  const user = await requireUser();
  const { serviceId } = await params;
  const body = await parseBody(req, reviewSchema);
  const rented = await db.rental.count({ where: { userId: user.id, serviceId, status: { in: ["ACTIVE", "EXPIRED"] } } });
  if (!rented) throw forbidden("You can review a service after renting it.");
  try {
    await db.$transaction(async (tx) => {
      await tx.review.create({ data: { serviceId, userId: user.id, authorName: user.name, ...body } });
      const agg = await tx.review.aggregate({ where: { serviceId }, _avg: { rating: true }, _count: true });
      await tx.service.update({ where: { id: serviceId }, data: { ratingAvg: Math.round((agg._avg.rating ?? 0) * 10) / 10, ratingCount: agg._count } });
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") throw conflict("You've already reviewed this service.");
    throw err;
  }
  return json({ ok: true }, { status: 201 });
});
