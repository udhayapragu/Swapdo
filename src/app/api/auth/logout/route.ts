import { handler, json } from "@/lib/http";
import { destroySession } from "@/lib/auth/session";

export const POST = handler(async () => {
  await destroySession();
  return json({ ok: true });
});
