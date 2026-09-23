// ─── Auth Security Utilities ─────────────────────────────────────────────────
// Password strength validation, input sanitization, account lock checks.

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4
  label: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong'
  feedback: string[]
}

/**
 * Validate password strength.
 * Returns a score from 0–4 and specific feedback messages.
 *
 * Criteria:
 *   - Minimum 8 characters
 *   - At least 1 uppercase letter
 *   - At least 1 lowercase letter
 *   - At least 1 number
 *   - At least 1 special character
 *
 * Score mapping:
 *   0 = very-weak (0 criteria)
 *   1 = weak      (1–2 criteria)
 *   2 = fair      (3 criteria)
 *   3 = good      (4 criteria)
 *   4 = strong    (5 criteria — all met)
 */
export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = []
  let metCount = 0

  if (password.length >= 8) {
    metCount++
  } else {
    feedback.push('Use at least 8 characters')
  }

  if (/[A-Z]/.test(password)) {
    metCount++
  } else {
    feedback.push('Add an uppercase letter')
  }

  if (/[a-z]/.test(password)) {
    metCount++
  } else {
    feedback.push('Add a lowercase letter')
  }

  if (/\d/.test(password)) {
    metCount++
  } else {
    feedback.push('Add a number')
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    metCount++
  } else {
    feedback.push('Add a special character')
  }

  let score: 0 | 1 | 2 | 3 | 4
  let label: PasswordStrengthResult['label']

  if (metCount <= 0) {
    score = 0
    label = 'very-weak'
  } else if (metCount <= 2) {
    score = 1
    label = 'weak'
  } else if (metCount === 3) {
    score = 2
    label = 'fair'
  } else if (metCount === 4) {
    score = 3
    label = 'good'
  } else {
    score = 4
    label = 'strong'
  }

  return { score, label, feedback }
}

/**
 * Sanitize email input: trim whitespace, convert to lowercase.
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Sanitize general text input: trim whitespace, strip HTML tags.
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/<[^>]*>/g, '')
}

/**
 * Check if an account is currently locked.
 * Returns { locked: boolean, lockedUntil: Date | null, remainingMinutes: number }
 */
export function checkAccountLock(
  failedLoginAttempts: number,
  lockedUntil: Date | null
): { locked: boolean; lockedUntil: Date | null; remainingMinutes: number } {
  if (!lockedUntil) {
    return { locked: false, lockedUntil: null, remainingMinutes: 0 }
  }

  const now = new Date()
  const lockDate = new Date(lockedUntil)

  if (now >= lockDate) {
    // Lock has expired
    return { locked: false, lockedUntil, remainingMinutes: 0 }
  }

  const remainingMs = lockDate.getTime() - now.getTime()
  const remainingMinutes = Math.ceil(remainingMs / (60 * 1000))

  return { locked: true, lockedUntil, remainingMinutes }
}

/**
 * Constants for account lockout policy
 */
export const MAX_FAILED_ATTEMPTS = 5
export const LOCK_DURATION_MINUTES = 15
