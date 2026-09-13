/**
 * In-memory sliding-window rate limiter (BRD 6.9, 6.14): `limit` hits per `windowMs` per key.
 *
 * Single-instance assumption: the map lives in this Node process. CranL runs one container
 * for this site; if it ever scales out, move the window to a shared store (the API shape
 * stays the same). Entries are pruned on each call so the map cannot grow unbounded.
 */
export interface RateLimiter {
  /** Returns whether the key is still within its budget and records the hit if so. */
  hit(key: string, now?: number): { allowed: boolean; remaining: number; retryAfterMs: number };
  reset(): void;
}

export function createRateLimiter(limit: number, windowMs: number): RateLimiter {
  const hits = new Map<string, number[]>();

  function prune(now: number) {
    for (const [key, times] of hits) {
      const fresh = times.filter((t) => now - t < windowMs);
      if (fresh.length === 0) hits.delete(key);
      else hits.set(key, fresh);
    }
  }

  return {
    hit(key, now = Date.now()) {
      prune(now);
      const times = hits.get(key) ?? [];
      if (times.length >= limit) {
        const oldest = times[0] ?? now;
        return {
          allowed: false,
          remaining: 0,
          retryAfterMs: Math.max(0, windowMs - (now - oldest)),
        };
      }
      times.push(now);
      hits.set(key, times);
      return { allowed: true, remaining: limit - times.length, retryAfterMs: 0 };
    },
    reset() {
      hits.clear();
    },
  };
}

/**
 * Client address behind one trusted proxy: the LAST `x-forwarded-for` entry is the one the
 * proxy appended; the first is client-controlled and must not be trusted.
 */
export function clientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) {
    const parts = xff
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const last = parts.at(-1);
    if (last) return last;
  }
  return headers.get('x-real-ip')?.trim() || 'unknown';
}
