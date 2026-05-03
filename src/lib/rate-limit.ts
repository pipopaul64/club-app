/**
 * In-memory rate limiter.
 *
 * Good for single-instance deployments (dev, MVP pilot on Vercel single-region).
 * For multi-instance production: swap the Map for Redis/Upstash.
 */

interface RateRecord {
  count: number
  resetAt: number
}

// Module-level store — persists across requests in the same process
const store = new Map<string, RateRecord>()

// Cleanup stale entries every 10 minutes to avoid memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of store.entries()) {
      if (record.resetAt < now) store.delete(key)
    }
  }, 10 * 60 * 1000)
}

/**
 * Check whether a given key is within its rate limit.
 *
 * @param key       Unique identifier (e.g. `register:192.168.1.1`)
 * @param limit     Max requests allowed in the window
 * @param windowMs  Window duration in milliseconds
 * @returns `true` if the request is allowed, `false` if limit exceeded
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now()
  const record = store.get(key)

  if (!record || record.resetAt < now) {
    // First request in this window (or window expired)
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (record.count >= limit) return false

  record.count++
  return true
}

/**
 * Returns the remaining requests and reset time for a given key.
 * Useful for setting Retry-After headers.
 */
export function getRateLimitInfo(
  key: string,
  limit: number,
  windowMs: number,
): { remaining: number; resetAt: number } {
  const now = Date.now()
  const record = store.get(key)

  if (!record || record.resetAt < now) {
    return { remaining: limit, resetAt: now + windowMs }
  }

  return {
    remaining: Math.max(0, limit - record.count),
    resetAt: record.resetAt,
  }
}

// Exposed only for tests — not for production use
export function _clearStore() {
  store.clear()
}
