export const dynamic = 'force-dynamic'
// ─── SMTP Connection Test API ───────────────────────────────────────────────
// Allows admins to test SMTP connectivity from the admin portal.
// POST with optional { to } to send a test email.

import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth-helpers'
import { testSmtpConnection, isSmtpConfigured, sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { to, sendTestEmail } = body

    // Check if SMTP is configured
    if (!isSmtpConfigured()) {
      return NextResponse.json({
        success: false,
        message: 'SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.',
        configured: false,
      })
    }

    // Test the connection
    const connectionTest = await testSmtpConnection()

    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: connectionTest.message,
        configured: true,
        connected: false,
        config: connectionTest.config,
      })
    }

    // Optionally send a test email
    if (sendTestEmail && to) {
      const testResult = await sendEmail({
        to,
        subject: 'SMTP Test Email — Er. Raju Kumawat Tech',
        body: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #D97706;">SMTP Test Successful</h2>
            <p>This is a test email from the Er. Raju Kumawat Tech admin panel.</p>
            <p>If you received this email, your SMTP configuration is working correctly.</p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
            <p style="color: #6B7280; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
          </div>
        `,
        type: 'notification',
      })

      return NextResponse.json({
        success: testResult.success,
        message: testResult.success
          ? `Test email sent to ${to}`
          : 'SMTP connection OK, but failed to send test email.',
        configured: true,
        connected: true,
        emailSent: testResult.success,
        config: connectionTest.config,
      })
    }

    return NextResponse.json({
      success: true,
      message: connectionTest.message,
      configured: true,
      connected: true,
      config: connectionTest.config,
    })
  } catch (error: any) {
    console.error('[SMTP-TEST] Error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
