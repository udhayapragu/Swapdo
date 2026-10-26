import { handler, json } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";
import { cancelAtPeriodEnd } from "@/lib/subscriptions/service";

export const POST = handler(async () => {
  const user = await requireUser();
  await cancelAtPeriodEnd(user.id);
  return json({ ok: true });
});
