// ─── Email Service ───────────────────────────────────────────────────────────
// Supports configurable SMTP via environment variables.
// Falls back to log-based sending (console + EmailLog DB table) when SMTP is not configured.
//
// SMTP Configuration (environment variables):
//   SMTP_HOST   - SMTP server hostname (e.g. smtp.gmail.com)
//   SMTP_PORT   - SMTP server port (default: 587)
//   SMTP_SECURE - Use SSL/TLS (default: false, true for port 465)
//   SMTP_USER   - SMTP authentication username
//   SMTP_PASS   - SMTP authentication password / app password
//   SMTP_FROM   - Default "From" address (e.g. "MyApp <noreply@example.com>")

import { db } from '@/lib/db'

// ─── Types ──────────────────────────────────────────────────────────────────
export type EmailType = 'notification' | 'access_change' | 'test_published' | 'welcome' | 'payment_receipt' | 'password_reset'

export interface SendEmailOptions {
  to: string
  subject: string
  body: string
  type: EmailType
  organizationId?: string
  from?: string // Optional override for the From address
}

// ─── SMTP Configuration ─────────────────────────────────────────────────────
interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim()
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS?.trim()

  // SMTP is only considered configured if host, user, and pass are all set
  if (!host || !user || !pass) {
    return null
  }

  const portStr = process.env.SMTP_PORT?.trim()
  const port = portStr ? parseInt(portStr, 10) : 587
  const secureStr = process.env.SMTP_SECURE?.trim()
  // Auto-detect secure mode: true if port is 465, false otherwise (unless explicitly set)
  const secure = secureStr ? secureStr === 'true' : port === 465
  const from = process.env.SMTP_FROM?.trim() || `"${process.env.NEXT_PUBLIC_APP_NAME || 'Er. Raju Kumawat Tech'}" <${user}>`

  return { host, port, secure, user, pass, from }
}

/**
 * Check whether SMTP is configured and ready to send real emails.
 */
export function isSmtpConfigured(): boolean {
  return getSmtpConfig() !== null
}

// ─── Lazy-loaded nodemailer transporter ──────────────────────────────────────
let _transporter: any = null
let _transporterConfigHash: string = ''

async function getTransporter(): Promise<any> {
  const config = getSmtpConfig()
  if (!config) return null

  // Recreate transporter if config changed (e.g. env vars updated in dev)
  const configHash = `${config.host}:${config.port}:${config.user}`
  if (_transporter && _transporterConfigHash === configHash) {
    return _transporter
  }

  try {
    const nodemailer = await import('nodemailer')
    _transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    })
    _transporterConfigHash = configHash
    return _transporter
  } catch (error) {
    console.error('[EMAIL] Failed to create SMTP transporter:', error)
    return null
  }
}

// ─── Core Send Function ─────────────────────────────────────────────────────
/**
 * Send an email via SMTP (if configured) or log-based fallback.
 * Always saves to the EmailLog table for audit purposes.
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; logId?: string; method?: string }> {
  const { to, subject, body, type, organizationId, from } = options

  const smtpConfig = getSmtpConfig()
  const useSmtp = smtpConfig !== null

  try {
    if (useSmtp) {
      // ── SMTP Mode: Send real email ──
      const transporter = await getTransporter()
      if (!transporter) {
        console.warn('[EMAIL] SMTP configured but transporter creation failed, falling back to log mode')
        return sendEmailLogFallback(to, subject, body, type, organizationId)
      }

      // Verify transporter connection
      try {
        await transporter.verify()
      } catch (verifyError) {
        console.error('[EMAIL] SMTP connection verification failed, falling back to log mode:', verifyError)
        return sendEmailLogFallback(to, subject, body, type, organizationId)
      }

      // Send the email
      const result = await transporter.sendMail({
        from: from || smtpConfig.from,
        to,
        subject,
        html: body,
      })

      // Log successful send to EmailLog
      const log = await db.emailLog.create({
        data: {
          to,
          subject,
          body,
          type,
          organizationId: organizationId || null,
          status: 'sent',
          sentAt: new Date(),
        },
      })

      console.log(`[EMAIL] SMTP sent: type=${type} to=${to} subject="${subject}" logId=${log.id} messageId=${result.messageId}`)

      return { success: true, logId: log.id, method: 'smtp' }
    } else {
      // ── Log Mode: Development fallback ──
      return sendEmailLogFallback(to, subject, body, type, organizationId)
    }
  } catch (error) {
    console.error(`[EMAIL] Failed to send: type=${type} to=${to}`, error)

    // Try to log the failure
    try {
      await db.emailLog.create({
        data: {
          to,
          subject,
          body,
          type,
          organizationId: organizationId || null,
          status: 'failed',
        },
      })
    } catch {
      // Even logging failed
    }

    return { success: false }
  }
}

/**
 * Log-based fallback: saves email to the EmailLog table and logs to console.
 * Used when SMTP is not configured (development mode).
 */
async function sendEmailLogFallback(
  to: string,
  subject: string,
  body: string,
  type: string,
  organizationId?: string
): Promise<{ success: boolean; logId?: string; method?: string }> {
  try {
    const log = await db.emailLog.create({
      data: {
        to,
        subject,
        body,
        type,
        organizationId: organizationId || null,
        status: 'sent',
        sentAt: new Date(),
      },
    })

    console.log(`[EMAIL] Log mode: type=${type} to=${to} subject="${subject}" logId=${log.id}`)
    console.log(`[EMAIL] ─── Email Content Preview ───`)
    console.log(`[EMAIL] To: ${to}`)
    console.log(`[EMAIL] Subject: ${subject}`)
    console.log(`[EMAIL] Type: ${type}`)
    console.log(`[EMAIL] Body length: ${body.length} chars`)
    console.log(`[EMAIL] ─── End Preview ───`)

    // In development, also log a preview link if available
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EMAIL] 💡 Tip: Configure SMTP_HOST, SMTP_USER, SMTP_PASS to send real emails`)
    }

    return { success: true, logId: log.id, method: 'log' }
  } catch (dbError) {
    console.error('[EMAIL] Failed to log email to database:', dbError)
    return { success: false }
  }
}

// ─── SMTP Connection Test ───────────────────────────────────────────────────
/**
 * Test the SMTP connection. Returns success/failure with details.
 * Useful for admin settings pages to verify SMTP configuration.
 */
export async function testSmtpConnection(): Promise<{
  success: boolean
  message: string
  config?: { host: string; port: number; secure: boolean; user: string; from: string }
}> {
  const config = getSmtpConfig()

  if (!config) {
    return {
      success: false,
      message: 'SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.',
    }
  }

  try {
    const transporter = await getTransporter()
    if (!transporter) {
      return {
        success: false,
        message: 'Failed to create SMTP transporter.',
        config: { host: config.host, port: config.port, secure: config.secure, user: config.user, from: config.from },
      }
    }

    await transporter.verify()

    return {
      success: true,
      message: `SMTP connection verified: ${config.host}:${config.port}`,
      config: { host: config.host, port: config.port, secure: config.secure, user: config.user, from: config.from },
    }
  } catch (error: any) {
    return {
      success: false,
      message: `SMTP connection failed: ${error.message || 'Unknown error'}`,
      config: { host: config.host, port: config.port, secure: config.secure, user: config.user, from: config.from },
    }
  }
}

// ─── Specialized Email Functions ─────────────────────────────────────────────

/**
 * Send access change notification to a teacher.
 */
export async function sendAccessChangeEmail(
  teacherEmail: string,
  teacherName: string,
  changes: { enabled: string[]; disabled: string[] },
  orgName: string,
  organizationId?: string
): Promise<{ success: boolean }> {
  const { buildAccessChangeEmail } = await import('@/lib/email-templates')
  const { subject, html } = buildAccessChangeEmail(teacherName, changes, orgName)

  const result = await sendEmail({
    to: teacherEmail,
    subject,
    body: html,
    type: 'access_change',
    organizationId,
  })

  return { success: result.success }
}

/**
 * Send test published notification to students.
 */
export async function sendTestPublishedEmail(
  studentEmails: string[],
  testTitle: string,
  orgName: string,
  organizationId?: string
): Promise<{ success: boolean; sentCount: number }> {
  const { buildTestPublishedEmail } = await import('@/lib/email-templates')

  let sentCount = 0
  for (const email of studentEmails) {
    const { subject, html } = buildTestPublishedEmail(email, testTitle, orgName)
    const result = await sendEmail({
      to: email,
      subject,
      body: html,
      type: 'test_published',
      organizationId,
    })
    if (result.success) sentCount++
  }

  return { success: true, sentCount }
}

/**
 * Send welcome email to a new user.
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  orgName: string,
  orgCode: string,
  organizationId?: string
): Promise<{ success: boolean }> {
  const { buildWelcomeEmail } = await import('@/lib/email-templates')
  const { subject, html } = buildWelcomeEmail(name, orgName, orgCode)

  const result = await sendEmail({
    to: email,
    subject,
    body: html,
    type: 'welcome',
    organizationId,
  })

  return { success: result.success }
}

/**
 * Send payment receipt email.
 */
export async function sendPaymentReceiptEmail(
  email: string,
  name: string,
  orderDetails: {
    orderId: string
    items: string
    totalAmount: number
    discountAmount: number
    finalAmount: number
  },
  orgName: string,
  organizationId?: string
): Promise<{ success: boolean }> {
  const { buildPaymentReceiptEmail } = await import('@/lib/email-templates')
  const { subject, html } = buildPaymentReceiptEmail(name, orderDetails, orgName)

  const result = await sendEmail({
    to: email,
    subject,
    body: html,
    type: 'payment_receipt',
    organizationId,
  })

  return { success: result.success }
}

/**
 * Send password reset email to a user.
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetLink: string,
  orgName: string,
  organizationId?: string
): Promise<{ success: boolean }> {
  const { buildPasswordResetEmail } = await import('@/lib/email-templates')
  const { subject, html } = buildPasswordResetEmail(name, resetLink, orgName)

  const result = await sendEmail({
    to: email,
    subject,
    body: html,
    type: 'password_reset',
    organizationId,
  })

  return { success: result.success }
}
