import { conflict, handler, json } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";
import { retryOrderPayment } from "@/lib/payments/fulfillment";

export const POST = handler(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  const payment = await retryOrderPayment(user.id, id);
  if (!payment) throw conflict("This order can't be retried.");
  return json({ ok: true });
});
