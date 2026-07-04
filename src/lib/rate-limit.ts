interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitEntry>();

const MAX_TRACKED_KEYS = 1000;

/**
 * Purge expired entries. Called lazily when the map grows large to avoid
 * unbounded memory growth from one-off callers (e.g. rotating IPs).
 */
function purgeExpired(now: number): void {
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

/**
 * Fixed-window in-memory rate limiter. Returns true if the request is
 * allowed, false if the caller has exceeded `limit` requests within the
 * current `windowMs` window.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();

  if (buckets.size > MAX_TRACKED_KEYS) {
    purgeExpired(now);
  }

  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count += 1;
  return true;
}

/** Test-only helper to reset all rate limit state between test cases. */
export function resetRateLimits(): void {
  buckets.clear();
}
