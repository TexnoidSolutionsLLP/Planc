interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Fixed-window in-memory rate limiter. This is deliberately simple and
 * process-local — fine for a single-instance deployment, but it does NOT
 * share state across multiple server instances. Swap the `store` for a
 * Redis-backed one (e.g. Upstash) behind this same `checkRateLimit` call
 * signature before running more than one instance in production; nothing
 * that calls `checkRateLimit` needs to change.
 */
const store = new Map<string, Bucket>();

// Prevent unbounded growth from one-off keys (e.g. per-IP) that are never hit again.
const MAX_ENTRIES = 50_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    if (store.size >= MAX_ENTRIES) store.clear();
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}
