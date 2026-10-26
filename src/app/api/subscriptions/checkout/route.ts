import { handler, json, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";
import { subscriptionCheckoutSchema } from "@/lib/validation";
import { startSubscriptionChange } from "@/lib/subscriptions/service";
import { rateLimit } from "@/lib/rate-limit";

export const POST = handler(async (req) => {
  const user = await requireUser();
  rateLimit(`checkout:${user.id}`, 20, 10 * 60_000);
  const body = await parseBody(req, subscriptionCheckoutSchema);
  return json(await startSubscriptionChange(user.id, body));
});
