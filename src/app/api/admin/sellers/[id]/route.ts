import { db } from "@/lib/db";
import { handler, json, notFound, parseBody, clientIp } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/session";
import { adminDecisionSchema } from "@/lib/validation";
import { audit, notify } from "@/lib/audit";

export const POST = handler(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin();
  const { id } = await params;
  const { decision, notes } = await parseBody(req, adminDecisionSchema);
  const seller = await db.seller.findUnique({ where: { id }, include: { user: true } });
  if (!seller) throw notFound("Seller not found.");
  await db.$transaction(async (tx) => {
    if (decision === "approve") {
      await tx.seller.update({ where: { id }, data: { status: "APPROVED", verified: true, verificationNotes: notes } });
      await tx.providerAuthorization.updateMany({ where: { sellerId: id, status: "PENDING" }, data: { status: "APPROVED", reviewedById: admin.id, reviewNotes: notes } });
      if (seller.user.role === "USER") await tx.user.update({ where: { id: seller.userId }, data: { role: "SELLER" } });
      await notify(seller.userId, { kind: "seller", title: "You're approved as a provider", body: "Create your first listing from the seller studio.", href: "/seller" }, tx);
    } else if (decision === "reject") {
      await tx.seller.update({ where: { id }, data: { status: "REJECTED", verificationNotes: notes } });
      await tx.providerAuthorization.updateMany({ where: { sellerId: id, status: "PENDING" }, data: { status: "REJECTED", reviewedById: admin.id, reviewNotes: notes } });
      await notify(seller.userId, { kind: "seller", title: "Provider application update", body: notes || "Your application wasn't approved. Contact support for details." }, tx);
    } else {
      await tx.seller.update({ where: { id }, data: { status: "SUSPENDED", verificationNotes: notes } });
      await tx.service.updateMany({ where: { sellerId: id, status: "APPROVED" }, data: { status: "SUSPENDED", moderationNotes: "Seller suspended" } });
    }
    await audit({ actorId: admin.id, action: `seller.${decision}`, entityType: "Seller", entityId: id, metadata: { notes }, ip: clientIp(req) }, tx);
  });
  return json({ ok: true });
});
