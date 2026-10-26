import { timingSafeEqual } from "node:crypto";
import { unauthorized } from "@/lib/http";

/** Cron endpoints require `Authorization: Bearer $CRON_SECRET`. */
export function assertCron(req: Request) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!secret || given.length !== secret.length || !timingSafeEqual(Buffer.from(given), Buffer.from(secret))) throw unauthorized("Invalid cron credentials.");
}
