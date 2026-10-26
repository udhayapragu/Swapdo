import { handler, json } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";
import { resumeSubscription } from "@/lib/subscriptions/service";

export const POST = handler(async () => {
  const user = await requireUser();
  await resumeSubscription(user.id);
  return json({ ok: true });
});
