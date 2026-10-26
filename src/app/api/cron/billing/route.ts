import { handler, json } from "@/lib/http";
import { runBillingCycle } from "@/lib/subscriptions/service";
import { assertCron } from "../auth";

export const POST = handler(async (req) => {
  assertCron(req);
  return json(await runBillingCycle());
});
