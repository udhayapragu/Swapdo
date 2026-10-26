import { ApiError } from "./http";

// Fixed-window in-memory limiter. Suitable for a single instance; use Redis
// (or your edge provider's limiter) when running multiple instances.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10000) for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    throw new ApiError(429, "rate_limited", "Too many requests. Please wait a moment and try again.", {
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    });
  }
}
