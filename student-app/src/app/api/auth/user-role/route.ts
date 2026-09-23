import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { sanitizeEmail } from '@/lib/auth-security'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

/**
 * GET /api/auth/user-role
 *
 * Returns the current user's role and login mode from session.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      role: user.role,
      loginMode: user.loginMode,
      orgCode: user.orgCode,
      orgName: user.orgName,
    })
  } catch (error) {
    console.error('[USER-ROLE] GET Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/auth/user-role
 *
 * Fallback method to get user role by looking up the database directly.
 * Used when session cookies are not yet available after NextAuth signIn().
 *
 * Body: { email: string, orgId: string }
 *
 * IMPORTANT: platform_admin users can login with ANY org code because
 * they oversee all organizations on the platform.
 */
export async function POST(req: NextRequest) {
  try {
    // ── Rate limiting (prevent user enumeration) ──
    const clientIp = getClientIp(req.headers)
    const rateLimitResult = checkRateLimit(`user-role:${clientIp}`)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { email: rawEmail, orgId: rawOrgId } = body

    if (!rawEmail || !rawOrgId) {
      return NextResponse.json(
        { success: false, message: 'Email and orgId are required' },
        { status: 400 }
      )
    }

    const email = sanitizeEmail(rawEmail)
    const orgId = rawOrgId.trim()

    // Find the user by email with organization
    const user = await db.user.findUnique({
      where: { email },
      include: { organization: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Platform admins can login with ANY org code — they oversee all orgs
    if (user.role !== 'platform_admin') {
      // For non-admin users, verify they belong to the specified organization
      const orgMatch =
        user.organization?.code === orgId ||
        user.organization?.id === orgId

      if (!orgMatch) {
        return NextResponse.json(
          { success: false, message: 'User does not belong to this organization' },
          { status: 403 }
        )
      }
    }

    if (!user.organization) {
      return NextResponse.json(
        { success: false, message: 'User has no organization' },
        { status: 400 }
      )
    }

    const loginMode = user.role === 'platform_admin' ? 'admin' : user.role === 'student' ? 'student' : 'cms'

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: user.organization.id,
        orgCode: user.organization.code,
        orgName: user.organization.name,
        orgAccent: user.organization.accentColor,
        loginMode,
      },
    })
  } catch (error) {
    console.error('[USER-ROLE] POST Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal error' },
      { status: 500 }
    )
  }
}
