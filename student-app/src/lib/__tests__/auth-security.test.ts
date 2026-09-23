import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  validatePasswordStrength,
  sanitizeEmail,
  sanitizeInput,
  checkAccountLock,
  MAX_FAILED_ATTEMPTS,
  LOCK_DURATION_MINUTES,
} from '@/lib/auth-security'

// ─── Constants ────────────────────────────────────────────────────────────────

describe('auth-security constants', () => {
  it('MAX_FAILED_ATTEMPTS equals 5', () => {
    expect(MAX_FAILED_ATTEMPTS).toBe(5)
  })

  it('LOCK_DURATION_MINUTES equals 15', () => {
    expect(LOCK_DURATION_MINUTES).toBe(15)
  })
})

// ─── validatePasswordStrength ─────────────────────────────────────────────────

describe('validatePasswordStrength', () => {
  describe('score tiers', () => {
    it('returns score 0 (very-weak) for an empty password — 0 criteria met', () => {
      const result = validatePasswordStrength('')
      expect(result.score).toBe(0)
      expect(result.label).toBe('very-weak')
    })

    it('returns score 1 (weak) when exactly 1 criterion is met', () => {
      // "abcdef" → length<8 ✗, upper ✗, lower ✓, digit ✗, special ✗ → 1
      const result = validatePasswordStrength('abcdef')
      expect(result.score).toBe(1)
      expect(result.label).toBe('weak')
    })

    it('returns score 1 (weak) when 2 criteria are met', () => {
      // "abcdefgh" → length ✓, upper ✗, lower ✓, digit ✗, special ✗ → 2
      const result = validatePasswordStrength('abcdefgh')
      expect(result.score).toBe(1)
      expect(result.label).toBe('weak')
    })

    it('returns score 2 (fair) when 3 criteria are met', () => {
      // "Abcdefgh" → length ✓, upper ✓, lower ✓, digit ✗, special ✗ → 3
      const result = validatePasswordStrength('Abcdefgh')
      expect(result.score).toBe(2)
      expect(result.label).toBe('fair')
    })

    it('returns score 3 (good) when 4 criteria are met', () => {
      // "Abcdefg1" → length ✓, upper ✓, lower ✓, digit ✓, special ✗ → 4
      const result = validatePasswordStrength('Abcdefg1')
      expect(result.score).toBe(3)
      expect(result.label).toBe('good')
    })

    it('returns score 4 (strong) when all 5 criteria are met', () => {
      const result = validatePasswordStrength('Abcdefg1!')
      expect(result.score).toBe(4)
      expect(result.label).toBe('strong')
    })
  })

  describe('feedback messages', () => {
    it('lists all 5 feedback messages when nothing is met (empty password)', () => {
      const result = validatePasswordStrength('')
      expect(result.feedback).toHaveLength(5)
      expect(result.feedback).toEqual([
        'Use at least 8 characters',
        'Add an uppercase letter',
        'Add a lowercase letter',
        'Add a number',
        'Add a special character',
      ])
    })

    it('omits "Use at least 8 characters" when length ≥ 8', () => {
      // "abcdefghijklmnop" → length ✓, upper ✗, lower ✓, digit ✗, special ✗ → 2
      const result = validatePasswordStrength('abcdefghijklmnop')
      expect(result.feedback).not.toContain('Use at least 8 characters')
    })

    it('includes "Add an uppercase letter" when uppercase is missing', () => {
      const result = validatePasswordStrength('abcdefg1!')
      expect(result.feedback).toContain('Add an uppercase letter')
    })

    it('omits "Add an uppercase letter" when uppercase is present', () => {
      const result = validatePasswordStrength('Abcdefg1!')
      expect(result.feedback).not.toContain('Add an uppercase letter')
    })

    it('includes "Add a lowercase letter" when lowercase is missing', () => {
      const result = validatePasswordStrength('ABCDEFG1!')
      expect(result.feedback).toContain('Add a lowercase letter')
    })

    it('includes "Add a number" when digit is missing', () => {
      const result = validatePasswordStrength('Abcdefgh!')
      expect(result.feedback).toContain('Add a number')
    })

    it('includes "Add a special character" when special char is missing', () => {
      const result = validatePasswordStrength('Abcdefg1')
      expect(result.feedback).toContain('Add a special character')
    })

    it('returns empty feedback array for a fully strong password', () => {
      const result = validatePasswordStrength('Abcdefg1!')
      expect(result.feedback).toHaveLength(0)
    })
  })

  describe('edge cases & criterion detection', () => {
    it('treats space as a special character', () => {
      // "Abcdefg " → length ✓, upper ✓, lower ✓, digit ✗, special ✓ (space) → 4
      const result = validatePasswordStrength('Abcdefg ')
      expect(result.score).toBe(3)
      expect(result.feedback).not.toContain('Add a special character')
      expect(result.feedback).toContain('Add a number')
    })

    it('detects length as the only missing criterion', () => {
      // "Ab1!" → 4 chars: length ✗, upper ✓, lower ✓, digit ✓, special ✓ → 4
      const result = validatePasswordStrength('Ab1!')
      expect(result.score).toBe(3)
      expect(result.feedback).toEqual(['Use at least 8 characters'])
    })

    it('accepts a common strong password "P@ssw0rd"', () => {
      const result = validatePasswordStrength('P@ssw0rd')
      expect(result.score).toBe(4)
      expect(result.label).toBe('strong')
      expect(result.feedback).toHaveLength(0)
    })

    it('handles exactly 8 characters as meeting the length criterion', () => {
      // "Abcdefg1" is exactly 8 chars → length ✓
      const result = validatePasswordStrength('Abcdefg1')
      expect(result.feedback).not.toContain('Use at least 8 characters')
    })

    it('handles 7 characters as NOT meeting the length criterion', () => {
      // "Abc1!xy" is 7 chars → length ✗, but upper ✓, lower ✓, digit ✓, special ✓ → 4
      const result = validatePasswordStrength('Abc1!xy')
      expect(result.feedback).toContain('Use at least 8 characters')
      expect(result.score).toBe(3)
    })

    it('treats a password of only digits as meeting only the digit criterion', () => {
      // "12345" → length ✗, upper ✗, lower ✗, digit ✓, special ✗ → 1
      const result = validatePasswordStrength('12345')
      expect(result.score).toBe(1)
      expect(result.feedback).not.toContain('Add a number')
    })

    it('treats a password of only symbols as meeting only the special criterion', () => {
      // "!@#$" → length ✗, upper ✗, lower ✗, digit ✗, special ✓ → 1
      const result = validatePasswordStrength('!@#$')
      expect(result.score).toBe(1)
      expect(result.feedback).not.toContain('Add a special character')
    })
  })
})

// ─── sanitizeEmail ────────────────────────────────────────────────────────────

describe('sanitizeEmail', () => {
  it('trims leading and trailing whitespace', () => {
    expect(sanitizeEmail('  user@example.com  ')).toBe('user@example.com')
  })

  it('lowercases an all-uppercase email', () => {
    expect(sanitizeEmail('USER@EXAMPLE.COM')).toBe('user@example.com')
  })

  it('lowercases a mixed-case email', () => {
    expect(sanitizeEmail('User@Example.COM')).toBe('user@example.com')
  })

  it('leaves an already-clean lowercase email unchanged', () => {
    expect(sanitizeEmail('user@example.com')).toBe('user@example.com')
  })

  it('returns empty string for empty input', () => {
    expect(sanitizeEmail('')).toBe('')
  })

  it('returns empty string for whitespace-only input', () => {
    expect(sanitizeEmail('   ')).toBe('')
  })

  it('trims tabs and newlines', () => {
    expect(sanitizeEmail('\tuser@example.com\n')).toBe('user@example.com')
  })

  it('handles a complex mixed-case email with subdomains', () => {
    expect(sanitizeEmail('  John.Doe@Mail.Example.Co.UK  ')).toBe(
      'john.doe@mail.example.co.uk'
    )
  })
})

// ─── sanitizeInput ────────────────────────────────────────────────────────────

describe('sanitizeInput', () => {
  it('trims leading and trailing whitespace', () => {
    expect(sanitizeInput('  hello world  ')).toBe('hello world')
  })

  it('strips a single HTML tag', () => {
    expect(sanitizeInput('<b>bold text</b>')).toBe('bold text')
  })

  it('strips multiple separate HTML tags', () => {
    expect(sanitizeInput('<b>bold</b> and <i>italic</i>')).toBe('bold and italic')
  })

  it('strips nested HTML tags', () => {
    expect(sanitizeInput('<div><p>nested content</p></div>')).toBe(
      'nested content'
    )
  })

  it('strips script tags but keeps inner text', () => {
    expect(sanitizeInput('<script>alert(1)</script>')).toBe('alert(1)')
  })

  it('strips self-closing tags', () => {
    expect(sanitizeInput('text<br/>more')).toBe('textmore')
  })

  it('returns plain text unchanged (no tags)', () => {
    expect(sanitizeInput('just plain text')).toBe('just plain text')
  })

  it('returns empty string for empty input', () => {
    expect(sanitizeInput('')).toBe('')
  })

  it('returns empty string for tags-only input', () => {
    expect(sanitizeInput('<div></div>')).toBe('')
  })

  it('preserves inner text when stripping tags with attributes', () => {
    expect(
      sanitizeInput('<a href="https://evil.com">click here</a>')
    ).toBe('click here')
  })
})

// ─── checkAccountLock ─────────────────────────────────────────────────────────

describe('checkAccountLock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns unlocked when lockedUntil is null', () => {
    const result = checkAccountLock(3, null)
    expect(result.locked).toBe(false)
    expect(result.lockedUntil).toBeNull()
    expect(result.remainingMinutes).toBe(0)
  })

  it('returns unlocked when lockedUntil is in the past (lock expired)', () => {
    const pastDate = new Date('2025-01-15T11:00:00Z') // 1 hour ago
    const result = checkAccountLock(5, pastDate)
    expect(result.locked).toBe(false)
    expect(result.remainingMinutes).toBe(0)
  })

  it('returns locked with correct remainingMinutes for a future date', () => {
    const futureDate = new Date('2025-01-15T12:10:00Z') // 10 min from now
    const result = checkAccountLock(5, futureDate)
    expect(result.locked).toBe(true)
    expect(result.lockedUntil).toEqual(futureDate)
    expect(result.remainingMinutes).toBe(10)
  })

  it('returns unlocked when lockedUntil is exactly now (boundary)', () => {
    const now = new Date('2025-01-15T12:00:00Z')
    const result = checkAccountLock(5, now)
    expect(result.locked).toBe(false)
    expect(result.remainingMinutes).toBe(0)
  })

  it('rounds up remainingMinutes to 1 for 1 second remaining', () => {
    // 1 second in the future → remainingMs = 1000 → ceil(1000/60000) = 1
    const futureDate = new Date('2025-01-15T12:00:01Z')
    const result = checkAccountLock(5, futureDate)
    expect(result.locked).toBe(true)
    expect(result.remainingMinutes).toBe(1)
  })

  it('rounds up remainingMinutes for 9 min 59 sec remaining', () => {
    // 599000 ms → ceil(599000/60000) = ceil(9.983) = 10
    const futureDate = new Date('2025-01-15T12:09:59Z')
    const result = checkAccountLock(5, futureDate)
    expect(result.locked).toBe(true)
    expect(result.remainingMinutes).toBe(10)
  })

  it('computes remainingMinutes = 60 for 1 hour in the future', () => {
    const futureDate = new Date('2025-01-15T13:00:00Z')
    const result = checkAccountLock(5, futureDate)
    expect(result.locked).toBe(true)
    expect(result.remainingMinutes).toBe(60)
  })

  it('preserves the original lockedUntil date in the result when locked', () => {
    const futureDate = new Date('2025-01-15T12:15:00Z')
    const result = checkAccountLock(5, futureDate)
    expect(result.lockedUntil).toEqual(futureDate)
  })

  it('preserves the original lockedUntil date in the result when expired', () => {
    const pastDate = new Date('2025-01-15T11:00:00Z')
    const result = checkAccountLock(5, pastDate)
    // When expired, the function returns the original date (not null)
    expect(result.lockedUntil).toEqual(pastDate)
    expect(result.locked).toBe(false)
  })

  it('does not depend on failedLoginAttempts value (param is unused by design)', () => {
    const futureDate = new Date('2025-01-15T12:10:00Z')
    const r1 = checkAccountLock(0, futureDate)
    const r2 = checkAccountLock(5, futureDate)
    const r3 = checkAccountLock(100, futureDate)
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })
})
