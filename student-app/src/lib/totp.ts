// ─── TOTP (Time-based One-Time Password) Implementation ──────────────────────
// Uses Node.js built-in crypto module only — no external libraries needed.

import { createHmac, randomBytes } from 'crypto'

// ─── Constants ──────────────────────────────────────────────────────────────
const TOTP_STEP = 30       // 30-second time step
const TOTP_DIGITS = 6      // 6-digit codes
const TOTP_WINDOW = 1      // Allow 1 step drift before/after

// ─── Base32 Encoding ────────────────────────────────────────────────────────
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

/**
 * Encode a Buffer to a Base32 string (RFC 4648).
 */
function base32Encode(buffer: Buffer): string {
  let bits = ''
  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, '0')
  }

  let result = ''
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0')
    const index = parseInt(chunk, 2)
    result += BASE32_CHARS[index]
  }

  return result
}

// ─── TOTP Functions ─────────────────────────────────────────────────────────

/**
 * Generate a random TOTP secret (Base32 encoded).
 * Default 20 bytes = 160 bits (recommended by RFC 6238).
 */
export function generateSecret(bytes: number = 20): string {
  const buffer = randomBytes(bytes)
  return base32Encode(buffer)
}

/**
 * Generate a TOTP code for a given secret and timestamp.
 * Implements HMAC-SHA1 with 30-second step and 6 digits per RFC 6238.
 */
export function generateTOTP(secret: string, timestamp?: number): string {
  const time = timestamp ?? Math.floor(Date.now() / 1000)
  const step = Math.floor(time / TOTP_STEP)

  // Decode Base32 secret to Buffer
  const key = base32Decode(secret)

  // Convert step to 8-byte big-endian buffer
  const stepBuffer = Buffer.alloc(8)
  stepBuffer.writeUInt32BE(Math.floor(step / 0x100000000), 0)
  stepBuffer.writeUInt32BE(step & 0xffffffff, 4)

  // HMAC-SHA1
  const hmac = createHmac('sha1', key)
  hmac.update(stepBuffer)
  const hmacResult = hmac.digest()

  // Dynamic truncation
  const offset = hmacResult[hmacResult.length - 1] & 0x0f
  const code =
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff)

  const otp = code % Math.pow(10, TOTP_DIGITS)
  return otp.toString().padStart(TOTP_DIGITS, '0')
}

/**
 * Verify a TOTP code against a secret.
 * Allows `window` steps of drift before and after the current step.
 */
export function verifyTOTP(
  secret: string,
  code: string,
  window: number = TOTP_WINDOW,
  timestamp?: number
): boolean {
  const time = timestamp ?? Math.floor(Date.now() / 1000)
  const currentStep = Math.floor(time / TOTP_STEP)

  // Check current step and window around it
  for (let i = -window; i <= window; i++) {
    const step = currentStep + i
    const stepTime = step * TOTP_STEP
    const expectedCode = generateTOTP(secret, stepTime)
    if (expectedCode === code) {
      return true
    }
  }

  return false
}

/**
 * Generate the otpauth:// URL for QR code scanning.
 * This URL can be used in Google Authenticator, Authy, etc.
 */
export function generateOTPAuthURL(
  secret: string,
  email: string,
  issuer: string = 'Er. Raju Kumawat Tech'
): string {
  const encodedIssuer = encodeURIComponent(issuer)
  const encodedEmail = encodeURIComponent(email)
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_STEP}`
}

/**
 * Generate backup codes (8-character alphanumeric).
 * Returns an array of unique codes.
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: Set<string> = new Set()

  while (codes.size < count) {
    const bytes = randomBytes(4)
    let code = ''
    for (const byte of bytes) {
      code += byte.toString(36).slice(-1).toUpperCase()
    }
    // Pad to 8 characters with additional randomness
    const extra = randomBytes(2)
    code += extra.toString('hex').toUpperCase().slice(0, 4)
    codes.add(code)
  }

  return Array.from(codes)
}

/**
 * Verify a backup code against the stored list.
 * If valid, removes the used code from the list (one-time use).
 */
export function verifyBackupCode(
  code: string,
  backupCodesJson: string
): { valid: boolean; remainingCodes: string[] } {
  try {
    const codes: string[] = JSON.parse(backupCodesJson)
    const index = codes.indexOf(code.toUpperCase())

    if (index === -1) {
      return { valid: false, remainingCodes: codes }
    }

    // Remove the used code
    const remaining = [...codes.slice(0, index), ...codes.slice(index + 1)]
    return { valid: true, remainingCodes: remaining }
  } catch {
    return { valid: false, remainingCodes: [] }
  }
}

// ─── Base32 Decoding ────────────────────────────────────────────────────────

/**
 * Decode a Base32 string to a Buffer.
 */
function base32Decode(str: string): Buffer {
  // Remove padding and whitespace, convert to uppercase
  const cleaned = str.replace(/[=\s]/g, '').toUpperCase()

  let bits = ''
  for (const char of cleaned) {
    const index = BASE32_CHARS.indexOf(char)
    if (index === -1) {
      throw new Error(`Invalid Base32 character: ${char}`)
    }
    bits += index.toString(2).padStart(5, '0')
  }

  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  }

  return Buffer.from(bytes)
}
