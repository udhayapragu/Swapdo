import { z } from "zod";
import { db } from "@/lib/db";
import { forbidden, handler, json, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";
import { getPaymentProvider } from "@/lib/payments";

/** SANDBOX ONLY: lets testers force the next renewal to fail. */
export const POST = handler(async (req) => {
  if (getPaymentProvider().name !== "mock") throw forbidden("Sandbox controls are disabled.");
  const user = await requireUser();
  const { simulateRenewalFailure } = await parseBody(req, z.object({ simulateRenewalFailure: z.boolean() }));
  await db.subscription.update({ where: { userId: user.id }, data: { simulateRenewalFailure } });
  return json({ ok: true });
});
