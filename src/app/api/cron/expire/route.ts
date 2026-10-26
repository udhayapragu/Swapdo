import { handler, json } from "@/lib/http";
import { expireLapsedRentals } from "@/lib/rentals/service";
import { assertCron } from "../auth";

const run = handler(async (req) => {
  assertCron(req);
  return json(await expireLapsedRentals());
});

// Vercel Cron calls GET with `Authorization: Bearer $CRON_SECRET`; POST stays for external schedulers.
export const GET = run;
export const POST = run;
