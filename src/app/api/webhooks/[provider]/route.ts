import { NextResponse } from "next/server";
import { processProviderWebhook } from "@/lib/payments/fulfillment";

const SIGNATURE_HEADERS: Record<string, string> = { razorpay: "x-razorpay-signature", mock: "x-mock-signature" };

/** Provider webhooks. The raw body is verified before anything is parsed or trusted. */
export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const header = SIGNATURE_HEADERS[provider];
  if (!header) return NextResponse.json({ error: "unknown_provider" }, { status: 404 });
  const raw = await req.text();
  if (raw.length > 256_000) return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  try {
    const result = await processProviderWebhook(provider, raw, req.headers.get(header), req.headers);
    console.info(JSON.stringify({ level: "info", msg: "webhook", provider, ...result }));
    if (result.status === "rejected") return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "webhook_failed", provider, err: String(err) }));
    // Non-2xx so the provider retries; idempotency makes retries safe.
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
}
