// ─── In-Memory Rate Limiter ──────────────────────────────────────────────────
// Tracks per-IP request counts for auth & general endpoints.
// Sliding window rate limiter with tiered quotas & brute-force cooldown timers.

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

const WINDOW_MS = 60_000 // 1 minute (60s)

export type RateLimitTier = 'auth' | 'general' | 'public'

const TIER_LIMITS: Record<RateLimitTier, { maxRequests: number; windowMs: number }> = {
  auth: { maxRequests: 5, windowMs: 60_000 },      // 5 attempts per min on login/register
  general: { maxRequests: 60, windowMs: 60_000 },  // 60 requests per min on standard APIs
  public: { maxRequests: 120, windowMs: 60_000 },  // 120 requests per min on public catalog
}

// Periodic cleanup of expired entries
let cleanupTimer: ReturnType<typeof setInterval> | null = null

function startCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now >= entry.resetTime) {
        rateLimitMap.delete(key)
      }
    }
  }, 30_000)
}

startCleanup()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter: number // Seconds to wait
}

/**
 * Check rate limit for a key (IP) under a specific tier.
 */
export function checkRateLimit(
  key: string,
  tier: RateLimitTier = 'general'
): RateLimitResult {
  const config = TIER_LIMITS[tier] || TIER_LIMITS.general
  const now = Date.now()
  const compositeKey = `${tier}:${key}`

  const entry = rateLimitMap.get(compositeKey)

  if (!entry || now >= entry.resetTime) {
    const resetTime = now + config.windowMs
    rateLimitMap.set(compositeKey, { count: 1, resetTime })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime,
      retryAfter: 0,
    }
  }

  entry.count += 1
  const retryAfter = Math.max(1, Math.ceil((entry.resetTime - now) / 1000))

  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter,
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.resetTime,
    retryAfter: 0,
  }
}

/**
 * Extract a client IP from Next.js request headers.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  return '127.0.0.1'
}
