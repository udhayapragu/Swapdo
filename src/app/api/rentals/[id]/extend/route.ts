import { handler, json, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";
import { createExtensionCheckout } from "@/lib/rentals/service";
import { extendSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export const POST = handler(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  rateLimit(`checkout:${user.id}`, 20, 10 * 60_000);
  const { id } = await params;
  const body = await parseBody(req, extendSchema);
  return json(await createExtensionCheckout(user.id, { rentalId: id, ...body }), { status: 201 });
});
