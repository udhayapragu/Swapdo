import { describe, expect, it } from "vitest";
import { hmacSha256Hex, verifyHmac } from "@/lib/payments/crypto";
import { mockProvider } from "@/lib/payments/mock";

describe("webhook signatures", () => {
  it("accepts valid and rejects tampered/missing signatures", () => {
    const body = JSON.stringify({ a: 1 });
    const sig = hmacSha256Hex("s3cret", body);
    expect(verifyHmac("s3cret", body, sig)).toBe(true);
    expect(verifyHmac("s3cret", body + " ", sig)).toBe(false);
    expect(verifyHmac("other", body, sig)).toBe(false);
    expect(verifyHmac("s3cret", body, null)).toBe(false);
    expect(verifyHmac("s3cret", body, "not-hex")).toBe(false);
    expect(verifyHmac("", body, sig)).toBe(false);
  });

  it("mock provider signs events it can verify", () => {
    const { raw, signature } = mockProvider.signEvent({ id: "evt_1", event: "payment.captured", order_id: "o", amount: 100 });
    expect(mockProvider.verifyWebhookSignature(raw, signature)).toBe(true);
    expect(mockProvider.verifyWebhookSignature(raw.replace("100", "1"), signature)).toBe(false);
  });
});
