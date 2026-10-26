import { handler, json } from "@/lib/http";
import { runBillingCycle } from "@/lib/subscriptions/service";
import { assertCron } from "../auth";

const run = handler(async (req) => {
  assertCron(req);
  return json(await runBillingCycle());
});

// Vercel Cron calls GET with `Authorization: Bearer $CRON_SECRET`; POST stays for external schedulers.
export const GET = run;
export const POST = run;
