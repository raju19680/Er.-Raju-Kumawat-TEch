import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { encode } from 'next-auth/jwt'

const AUTH_SECRET = process.env.NEXTAUTH_SECRET || 'er-raju-kumawat-tech-secret-key-2024'

/**
 * POST /api/auth/issue-token
 *
 * Issues an API token for the currently authenticated user.
 * Uses getAuthUser() to verify the user is authenticated,
 * then creates a short-lived JWT that can be sent as x-auth-token header.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Create a short-lived API token (1 hour)
    const apiToken = await encode({
      token: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: user.orgId,
        orgCode: user.orgCode,
        orgName: user.orgName,
        orgAccent: user.orgAccent,
        loginMode: user.loginMode,
        type: 'api-token',
      },
      secret: AUTH_SECRET,
      maxAge: 60 * 60, // 1 hour
    })

    return NextResponse.json({
      success: true,
      token: apiToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: user.orgId,
        orgCode: user.orgCode,
        orgName: user.orgName,
        orgAccent: user.orgAccent,
        loginMode: user.loginMode,
      },
    })
  } catch (error) {
    console.error('Issue token error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to issue token' },
      { status: 500 }
    )
  }
}
