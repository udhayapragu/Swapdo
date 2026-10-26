import { handler, json } from "@/lib/http";
import { requireAdmin } from "@/lib/auth/session";
import { runBillingCycle } from "@/lib/subscriptions/service";
import { expireLapsedRentals } from "@/lib/rentals/service";
import { audit } from "@/lib/audit";

/** Manually run the scheduled jobs (useful in development / sandbox). */
export const POST = handler(async () => {
  const admin = await requireAdmin();
  const [billing, rentals] = await Promise.all([runBillingCycle(), expireLapsedRentals()]);
  await audit({ actorId: admin.id, action: "jobs.run", entityType: "System", metadata: { billing, rentals } });
  return json({ billing, rentals });
});
