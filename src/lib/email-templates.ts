// ─── Email Templates ─────────────────────────────────────────────────────────
// HTML email templates for each notification type.
// Uses simple inline CSS for email compatibility.
// Professional design with amber/brand colors.

// ─── Brand Colors ───────────────────────────────────────────────────────────
const BRAND_COLOR = '#D97706' // amber-600
const BRAND_DARK = '#92400E'  // amber-800
const BRAND_LIGHT = '#FEF3C7' // amber-100
const BG_COLOR = '#F9FAFB'
const TEXT_COLOR = '#1F2937'
const TEXT_SECONDARY = '#6B7280'
const BORDER_COLOR = '#E5E7EB'

// ─── Base Template ──────────────────────────────────────────────────────────
function baseTemplate(content: string, orgName: string = 'Er. Raju Kumawat Tech'): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${orgName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${BG_COLOR}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${BG_COLOR}; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${BRAND_COLOR}; padding: 24px 32px;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 20px; font-weight: 700;">${orgName}</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid ${BORDER_COLOR}; background-color: ${BG_COLOR};">
              <p style="margin: 0; font-size: 12px; color: ${TEXT_SECONDARY}; text-align: center;">
                &copy; ${new Date().getFullYear()} ${orgName}. All rights reserved.
              </p>
              <p style="margin: 4px 0 0; font-size: 11px; color: ${TEXT_SECONDARY}; text-align: center;">
                This is an automated notification. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── Access Change Email ────────────────────────────────────────────────────
export function buildAccessChangeEmail(
  teacherName: string,
  changes: { enabled: string[]; disabled: string[] },
  orgName: string
): { subject: string; html: string } {
  const subject = `Module Access Updated - ${orgName}`

  const enabledList = changes.enabled.length > 0
    ? `<div style="margin: 12px 0;">
        <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #059669;">✅ Modules Enabled:</p>
        <ul style="margin: 0; padding-left: 20px;">
          ${changes.enabled.map(m => `<li style="font-size: 13px; color: ${TEXT_COLOR}; margin: 4px 0;">${m}</li>`).join('')}
        </ul>
      </div>`
    : ''

  const disabledList = changes.disabled.length > 0
    ? `<div style="margin: 12px 0;">
        <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #DC2626;">❌ Modules Disabled:</p>
        <ul style="margin: 0; padding-left: 20px;">
          ${changes.disabled.map(m => `<li style="font-size: 13px; color: ${TEXT_COLOR}; margin: 4px 0;">${m}</li>`).join('')}
        </ul>
      </div>`
    : ''

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: ${TEXT_COLOR};">Hello ${teacherName},</p>
    <p style="margin: 0 0 16px; font-size: 14px; color: ${TEXT_SECONDARY}; line-height: 1.6;">
      Your module access has been updated by the platform administrator. Here's a summary of the changes:
    </p>
    <div style="background-color: ${BRAND_LIGHT}; border-radius: 8px; padding: 16px; border: 1px solid #FDE68A;">
      ${enabledList}
      ${disabledList}
      ${changes.enabled.length === 0 && changes.disabled.length === 0
        ? '<p style="font-size: 13px; color: ${TEXT_SECONDARY};">No changes were made.</p>'
        : ''}
    </div>
    <p style="margin: 16px 0 0; font-size: 14px; color: ${TEXT_SECONDARY}; line-height: 1.6;">
      If you have any questions about these changes, please contact your administrator.
    </p>`

  return { subject, html: baseTemplate(content, orgName) }
}

// ─── Test Published Email ───────────────────────────────────────────────────
export function buildTestPublishedEmail(
  studentEmail: string,
  testTitle: string,
  orgName: string
): { subject: string; html: string } {
  const subject = `New Test Available: ${testTitle} - ${orgName}`

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: ${TEXT_COLOR};">Hello,</p>
    <p style="margin: 0 0 16px; font-size: 14px; color: ${TEXT_SECONDARY}; line-height: 1.6;">
      A new test has been published and is now available for you:
    </p>
    <div style="background-color: ${BRAND_LIGHT}; border-radius: 8px; padding: 20px; border: 1px solid #FDE68A; text-align: center;">
      <h2 style="margin: 0 0 8px; font-size: 18px; color: ${BRAND_DARK};">${testTitle}</h2>
      <p style="margin: 0; font-size: 13px; color: ${TEXT_SECONDARY};">by ${orgName}</p>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="#" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #FFFFFF; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 600;">
        Start Test
      </a>
    </div>
    <p style="margin: 0; font-size: 13px; color: ${TEXT_SECONDARY}; line-height: 1.6;">
      Log in to your student portal to view all available tests and start attempting them.
    </p>`

  return { subject, html: baseTemplate(content, orgName) }
}

// ─── Welcome Email ──────────────────────────────────────────────────────────
export function buildWelcomeEmail(
  name: string,
  orgName: string,
  orgCode: string
): { subject: string; html: string } {
  const subject = `Welcome to ${orgName}!`

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: ${TEXT_COLOR};">Welcome, ${name}! 👋</p>
    <p style="margin: 0 0 16px; font-size: 14px; color: ${TEXT_SECONDARY}; line-height: 1.6;">
      Your account has been created on <strong>${orgName}</strong>. You can now access the platform and start learning!
    </p>
    <div style="background-color: ${BRAND_LIGHT}; border-radius: 8px; padding: 20px; border: 1px solid #FDE68A;">
      <h3 style="margin: 0 0 12px; font-size: 14px; color: ${BRAND_DARK};">Getting Started:</h3>
      <ol style="margin: 0; padding-left: 20px;">
        <li style="font-size: 13px; color: ${TEXT_COLOR}; margin: 6px 0;">Visit the platform login page</li>
        <li style="font-size: 13px; color: ${TEXT_COLOR}; margin: 6px 0;">Enter your Institute ID: <code style="background-color: #FFFFFF; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 12px; color: ${BRAND_DARK}; border: 1px solid ${BORDER_COLOR};">${orgCode}</code></li>
        <li style="font-size: 13px; color: ${TEXT_COLOR}; margin: 6px 0;">Sign in with your email and password</li>
        <li style="font-size: 13px; color: ${TEXT_COLOR}; margin: 6px 0;">Start exploring courses and tests!</li>
      </ol>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="#" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #FFFFFF; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 600;">
        Go to Platform
      </a>
    </div>
    <p style="margin: 0; font-size: 13px; color: ${TEXT_SECONDARY}; line-height: 1.6;">
      If you have any questions, feel free to reach out to your instructor or the support team.
    </p>`

  return { subject, html: baseTemplate(content, orgName) }
}

// ─── Password Reset Email ──────────────────────────────────────────────────
export function buildPasswordResetEmail(
  name: string,
  resetLink: string,
  orgName: string
): { subject: string; html: string } {
  const subject = `Reset Your Password - ${orgName}`

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: ${TEXT_COLOR};">Hello ${name},</p>
    <p style="margin: 0 0 16px; font-size: 14px; color: ${TEXT_SECONDARY}; line-height: 1.6;">
      We received a request to reset your password. Click the button below to create a new password:
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${resetLink}" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #FFFFFF; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 600;">
        Reset Password
      </a>
    </div>
    <div style="background-color: #FEF2F2; border-radius: 8px; padding: 16px; border: 1px solid #FECACA;">
      <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #DC2626;">⚠️ Important:</p>
      <ul style="margin: 0; padding-left: 20px;">
        <li style="font-size: 13px; color: ${TEXT_COLOR}; margin: 4px 0;">This link will expire in <strong>1 hour</strong></li>
        <li style="font-size: 13px; color: ${TEXT_COLOR}; margin: 4px 0;">If you didn't request this, you can safely ignore this email</li>
        <li style="font-size: 13px; color: ${TEXT_COLOR}; margin: 4px 0;">Never share this link with anyone</li>
      </ul>
    </div>
    <p style="margin: 16px 0 0; font-size: 13px; color: ${TEXT_SECONDARY}; line-height: 1.6;">
      If the button above doesn't work, copy and paste this link into your browser:<br/>
      <a href="${resetLink}" style="color: ${BRAND_COLOR}; word-break: break-all;">${resetLink}</a>
    </p>`

  return { subject, html: baseTemplate(content, orgName) }
}

// ─── Payment Receipt Email ──────────────────────────────────────────────────
export function buildPaymentReceiptEmail(
  name: string,
  orderDetails: {
    orderId: string
    items: string
    totalAmount: number
    discountAmount: number
    finalAmount: number
  },
  orgName: string
): { subject: string; html: string } {
  const subject = `Payment Receipt - Order #${orderDetails.orderId.slice(0, 8)}`
  const currency = '₹'

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: ${TEXT_COLOR};">Hello ${name},</p>
    <p style="margin: 0 0 16px; font-size: 14px; color: ${TEXT_SECONDARY}; line-height: 1.6;">
      Thank you for your purchase! Here's your payment receipt:
    </p>
    <div style="background-color: ${BRAND_LIGHT}; border-radius: 8px; padding: 20px; border: 1px solid #FDE68A;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size: 13px; color: ${TEXT_SECONDARY}; padding: 8px 0; border-bottom: 1px solid #FDE68A;">Order ID</td>
          <td style="font-size: 13px; color: ${TEXT_COLOR}; text-align: right; padding: 8px 0; border-bottom: 1px solid #FDE68A; font-family: monospace;">#${orderDetails.orderId.slice(0, 8)}</td>
        </tr>
        <tr>
          <td style="font-size: 13px; color: ${TEXT_SECONDARY}; padding: 8px 0; border-bottom: 1px solid #FDE68A;">Items</td>
          <td style="font-size: 13px; color: ${TEXT_COLOR}; text-align: right; padding: 8px 0; border-bottom: 1px solid #FDE68A;">${orderDetails.items}</td>
        </tr>
        <tr>
          <td style="font-size: 13px; color: ${TEXT_SECONDARY}; padding: 8px 0; border-bottom: 1px solid #FDE68A;">Subtotal</td>
          <td style="font-size: 13px; color: ${TEXT_COLOR}; text-align: right; padding: 8px 0; border-bottom: 1px solid #FDE68A;">${currency}${orderDetails.totalAmount.toFixed(2)}</td>
        </tr>
        ${orderDetails.discountAmount > 0 ? `
        <tr>
          <td style="font-size: 13px; color: #059669; padding: 8px 0; border-bottom: 1px solid #FDE68A;">Discount</td>
          <td style="font-size: 13px; color: #059669; text-align: right; padding: 8px 0; border-bottom: 1px solid #FDE68A;">-${currency}${orderDetails.discountAmount.toFixed(2)}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="font-size: 15px; font-weight: 700; color: ${BRAND_DARK}; padding: 12px 0 4px;">Total Paid</td>
          <td style="font-size: 15px; font-weight: 700; color: ${BRAND_DARK}; text-align: right; padding: 12px 0 4px;">${currency}${orderDetails.finalAmount.toFixed(2)}</td>
        </tr>
      </table>
    </div>
    <p style="margin: 16px 0 0; font-size: 13px; color: ${TEXT_SECONDARY}; line-height: 1.6;">
      Your purchased items are now available in your account. Log in to start accessing them.
    </p>`

  return { subject, html: baseTemplate(content, orgName) }
}
