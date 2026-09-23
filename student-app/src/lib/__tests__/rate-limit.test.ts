import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

// ─── checkRateLimit ───────────────────────────────────────────────────────────
//
// NOTE: rate-limit.ts uses a module-level Map that persists across tests in the
// same file. To avoid cross-test interference, every test uses a unique key.
// Fake timers + vi.setSystemTime() make the time-based logic deterministic.
// ────────────────────────────────────────────────────────────────────────────

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows the first request and reports 29 remaining (MAX_REQUESTS - 1)', () => {
    const result = checkRateLimit('first-request-key')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(29)
    expect(result.resetTime).toBe(new Date('2025-01-15T12:01:00Z').getTime())
  })

  it('decrements remaining by 1 on each subsequent request within the window', () => {
    const key = 'decrement-key'
    checkRateLimit(key) // remaining 29
    const second = checkRateLimit(key)
    expect(second.remaining).toBe(28)
    const third = checkRateLimit(key)
    expect(third.remaining).toBe(27)
  })

  it('keeps resetTime constant for all requests within the same window', () => {
    const key = 'reset-const-key'
    const first = checkRateLimit(key)
    checkRateLimit(key)
    checkRateLimit(key)
    const fourth = checkRateLimit(key)
    expect(fourth.resetTime).toBe(first.resetTime)
  })

  it('allows exactly 30 requests (the 30th has remaining = 0)', () => {
    const key = 'exhaust-exact-key'
    let lastResult = checkRateLimit(key)
    for (let i = 1; i < 30; i++) {
      lastResult = checkRateLimit(key)
      expect(lastResult.allowed).toBe(true)
    }
    // 30th request
    expect(lastResult.allowed).toBe(true)
    expect(lastResult.remaining).toBe(0)
  })

  it('rejects the 31st request (allowed = false, remaining = 0)', () => {
    const key = 'reject-31st-key'
    for (let i = 0; i < 30; i++) {
      checkRateLimit(key)
    }
    const thirtyFirst = checkRateLimit(key)
    expect(thirtyFirst.allowed).toBe(false)
    expect(thirtyFirst.remaining).toBe(0)
  })

  it('keeps rejecting further requests after exhaustion within the same window', () => {
    const key = 'keep-rejecting-key'
    for (let i = 0; i < 30; i++) {
      checkRateLimit(key)
    }
    const r31 = checkRateLimit(key)
    const r32 = checkRateLimit(key)
    const r33 = checkRateLimit(key)
    expect(r31.allowed).toBe(false)
    expect(r32.allowed).toBe(false)
    expect(r33.allowed).toBe(false)
  })

  it('starts a fresh window after the 60s window elapses', () => {
    const key = 'window-reset-key'
    // Exhaust the key
    for (let i = 0; i < 30; i++) {
      checkRateLimit(key)
    }
    const blocked = checkRateLimit(key)
    expect(blocked.allowed).toBe(false)

    // Advance time past the window (60s + 1ms)
    vi.advanceTimersByTime(60_001)

    // Next request should open a brand-new window
    const afterReset = checkRateLimit(key)
    expect(afterReset.allowed).toBe(true)
    expect(afterReset.remaining).toBe(29)
  })

  it('resets the count to 1 (not 0) when a new window opens', () => {
    const key = 'new-window-count-key'
    // First window: 5 requests
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key)
    }
    // Advance past window
    vi.advanceTimersByTime(60_001)
    // New window — first request should report 29 remaining (count = 1)
    const result = checkRateLimit(key)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(29)
    // Second request in the new window: 28 remaining
    const second = checkRateLimit(key)
    expect(second.remaining).toBe(28)
  })

  it('treats independent keys with separate counters', () => {
    const keyA = 'independent-A'
    const keyB = 'independent-B'
    // Make 5 requests on keyA
    for (let i = 0; i < 5; i++) {
      checkRateLimit(keyA)
    }
    // keyB should be unaffected — its first request returns 29 remaining
    const resultB = checkRateLimit(keyB)
    expect(resultB.allowed).toBe(true)
    expect(resultB.remaining).toBe(29)

    // keyA's 6th request returns 24 remaining (30 - 6)
    const resultA = checkRateLimit(keyA)
    expect(resultA.remaining).toBe(24)
  })

  it('exhausting key A does not block key B', () => {
    const keyA = 'exhaust-A'
    const keyB = 'unaffected-B'
    for (let i = 0; i < 30; i++) {
      checkRateLimit(keyA)
    }
    const blockedA = checkRateLimit(keyA)
    expect(blockedA.allowed).toBe(false)

    const allowedB = checkRateLimit(keyB)
    expect(allowedB.allowed).toBe(true)
    expect(allowedB.remaining).toBe(29)
  })

  it('does not reset the window prematurely (request just before 60s keeps counting)', () => {
    const key = 'no-premature-reset-key'
    checkRateLimit(key) // t=0, count=1
    vi.advanceTimersByTime(59_999) // t=59.999s — still within window
    const second = checkRateLimit(key)
    // Should still be in the same window: count=2, remaining=28
    expect(second.allowed).toBe(true)
    expect(second.remaining).toBe(28)
  })

  it('reports a new resetTime when a new window opens', () => {
    const key = 'new-reset-time-key'
    const first = checkRateLimit(key)
    const originalResetTime = first.resetTime

    vi.advanceTimersByTime(60_001)

    const afterReset = checkRateLimit(key)
    expect(afterReset.resetTime).toBeGreaterThan(originalResetTime)
    // New resetTime should be ~60s after the advanced "now"
    const expectedNewReset = new Date('2025-01-15T12:01:00Z').getTime() + 60_001
    expect(afterReset.resetTime).toBe(expectedNewReset)
  })
})

// ─── getClientIp ──────────────────────────────────────────────────────────────

describe('getClientIp', () => {
  it('returns the IP from x-forwarded-for header', () => {
    const headers = new Headers({
      'x-forwarded-for': '203.0.113.5',
    })
    expect(getClientIp(headers)).toBe('203.0.113.5')
  })

  it('returns the first IP when x-forwarded-for contains multiple IPs', () => {
    const headers = new Headers({
      'x-forwarded-for': '203.0.113.5, 198.51.100.1, 192.0.2.9',
    })
    expect(getClientIp(headers)).toBe('203.0.113.5')
  })

  it('trims whitespace around the first IP in x-forwarded-for', () => {
    const headers = new Headers({
      'x-forwarded-for': '  203.0.113.5  , 198.51.100.1',
    })
    expect(getClientIp(headers)).toBe('203.0.113.5')
  })

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const headers = new Headers({
      'x-real-ip': '198.51.100.10',
    })
    expect(getClientIp(headers)).toBe('198.51.100.10')
  })

  it('trims whitespace around x-real-ip', () => {
    const headers = new Headers({
      'x-real-ip': '  198.51.100.10  ',
    })
    expect(getClientIp(headers)).toBe('198.51.100.10')
  })

  it('prefers x-forwarded-for over x-real-ip when both are present', () => {
    const headers = new Headers({
      'x-forwarded-for': '203.0.113.5',
      'x-real-ip': '198.51.100.10',
    })
    expect(getClientIp(headers)).toBe('203.0.113.5')
  })

  it('returns "unknown" when no IP headers are present', () => {
    const headers = new Headers({})
    expect(getClientIp(headers)).toBe('unknown')
  })

  it('returns "unknown" when IP headers are empty strings', () => {
    // Headers with empty values — the `if (forwarded)` check is falsy for ''
    const headers = new Headers({
      'x-forwarded-for': '',
      'x-real-ip': '',
    })
    expect(getClientIp(headers)).toBe('unknown')
  })
})
