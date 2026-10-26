import "server-only";
import { redirect } from "next/navigation";
import { requirePageUser } from "./auth/session";
import { db } from "./db";

/** Seller pages: must be signed in and have an approved provider account. */
export async function requireSellerPage() {
  const user = await requirePageUser({ next: "/seller" });
  if (!user.sellerId) redirect("/sell");
  const seller = await db.seller.findUniqueOrThrow({ where: { id: user.sellerId } });
  if (seller.status !== "APPROVED") redirect("/sell");
  return { user, seller };
}
