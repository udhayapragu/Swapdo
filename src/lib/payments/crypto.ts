import { createHmac, timingSafeEqual } from "node:crypto";

export function hmacSha256Hex(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ab.length === bb.length && ab.length > 0 && timingSafeEqual(ab, bb);
}

export function verifyHmac(secret: string, payload: string, signature: string | null): boolean {
  if (!secret || !signature || !/^[0-9a-f]+$/i.test(signature)) return false;
  return safeEqualHex(hmacSha256Hex(secret, payload), signature.toLowerCase());
}
