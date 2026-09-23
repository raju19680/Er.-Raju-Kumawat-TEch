import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeEmail } from '@/lib/auth-security'

/**
 * POST /api/auth/complete-login
 *
 * Called by the client after NextAuth signIn() succeeds.
 * Returns user data directly from the database — does NOT depend on session cookies.
 * This is the most reliable way to get user role/loginMode after authentication.
 */
export async function POST(req: NextRequest) {
  try {
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

    // Find user by email with organization
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

    // Platform admins can login with ANY org code
    if (user.role !== 'platform_admin') {
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
    console.error('[COMPLETE-LOGIN] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal error' },
      { status: 500 }
    )
  }
}
