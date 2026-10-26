import { db } from "@/lib/db";
import { handler, json, notFound } from "@/lib/http";

export const GET = handler(async (_req, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const service = await db.service.findFirst({
    where: { slug, status: "APPROVED" },
    include: {
      seller: { select: { displayName: true, slug: true, verified: true } },
      category: { select: { name: true, slug: true } },
      plans: { where: { active: true }, orderBy: { durationMinutes: "asc" } },
      reviews: { orderBy: { createdAt: "desc" }, take: 20, select: { authorName: true, rating: true, title: true, body: true, isDemo: true, createdAt: true } },
    },
  });
  if (!service) throw notFound("Service not found.");
  return json({ service, serverTime: new Date().toISOString() });
});
