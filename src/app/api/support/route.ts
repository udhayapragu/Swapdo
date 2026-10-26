import { db } from "@/lib/db";
import { handler, json, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";
import { ticketSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export const POST = handler(async (req) => {
  const user = await requireUser();
  rateLimit(`ticket:${user.id}`, 5, 60 * 60_000);
  const body = await parseBody(req, ticketSchema);
  const ticket = await db.supportTicket.create({ data: { userId: user.id, ...body } });
  return json({ ok: true, ticketId: ticket.id }, { status: 201 });
});
