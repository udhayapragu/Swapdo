import { handler, json } from "@/lib/http";
import { expireLapsedRentals } from "@/lib/rentals/service";
import { assertCron } from "../auth";

export const POST = handler(async (req) => {
  assertCron(req);
  return json(await expireLapsedRentals());
});
