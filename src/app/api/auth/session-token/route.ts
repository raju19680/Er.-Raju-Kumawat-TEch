import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { encode, getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'
import { sanitizeEmail } from '@/lib/auth-security'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const AUTH_SECRET = process.env.NEXTAUTH_SECRET || 'er-raju-kumawat-tech-secret-key-2024'

/**
 * POST /api/auth/session-token
 *
 * After NextAuth login, the browser has a session cookie but API routes
 * may not be able to read it in certain environments. This endpoint
 * creates a short-lived API token from the session and returns it.
 * The frontend stores this token and sends it as x-auth-token header.
 *
 * Supports two modes:
 * 1. Session-based: Reads the session from cookies (most secure)
 * 2. Body-based: Uses email + orgId from POST body to look up user in DB
 *    (fallback when session cookies aren't available yet after signIn)
 */
export async function POST(req: NextRequest) {
  try {
    // ── Rate limiting (prevent token abuse) ──
    const clientIp = getClientIp(req.headers)
    const rateLimitResult = checkRateLimit(`session-token:${clientIp}`)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Read body once at the beginning
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      // No body or invalid JSON
    }

    let sessionUser: any = null

    // Method 1: getServerSession (most reliable in same-origin)
    try {
      const session = await getServerSession(authOptions)
      if (session?.user) {
        sessionUser = session.user
      }
    } catch (e) {
      console.log('[SESSION-TOKEN] getServerSession failed:', e instanceof Error ? e.message : e)
    }

    // Method 2: getToken() — reads JWT directly from request cookie
    if (!sessionUser) {
      try {
        const isSecureViaHeader = req.headers.get('x-forwarded-proto') === 'https'

        let token = await getToken({
          req,
          secret: AUTH_SECRET,
          secureCookie: isSecureViaHeader,
        })

        if (!token) {
          token = await getToken({
            req,
            secret: AUTH_SECRET,
            secureCookie: !isSecureViaHeader,
          })
        }

        if (token?.email) {
          sessionUser = token
        }
      } catch (e) {
        console.log('[SESSION-TOKEN] getToken failed:', e instanceof Error ? e.message : e)
      }
    }

    // Method 3: Read user data from POST body and verify against database
    // This is the fallback for when session cookies aren't available yet
    if (!sessionUser) {
      const { email: rawEmail, orgId: rawOrgId } = body

      if (rawEmail && rawOrgId) {
        try {
          const email = sanitizeEmail(rawEmail)
          const orgId = rawOrgId.trim()

          const user = await db.user.findUnique({
            where: { email },
            include: { organization: true },
          })

          if (user && user.organization) {
            // Platform admins can login with ANY org code — they oversee all orgs
            const orgMatch =
              user.role === 'platform_admin' ||
              user.organization.code === orgId ||
              user.organization.id === orgId

            if (orgMatch) {
              const normalizedRole = user.role?.toLowerCase()
    const loginMode = (normalizedRole === 'platform_admin' || normalizedRole === 'admin' || normalizedRole === 'org_admin') ? 'admin' : (normalizedRole === 'student' || normalizedRole === 'user') ? 'student' : 'cms'

              sessionUser = {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                orgId: user.organization.id,
                orgCode: user.organization.code,
                orgName: user.organization.name,
                orgAccent: user.organization.accentColor,
                loginMode,
              }
            }
          }
        } catch (e) {
          console.log('[SESSION-TOKEN] DB lookup fallback failed:', e instanceof Error ? e.message : e)
        }
      }
    }

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, message: 'No authenticated session found' },
        { status: 401 }
      )
    }

    // Create a short-lived API token (1 hour)
    const apiToken = await encode({
      token: {
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.name,
        role: sessionUser.role,
        orgId: sessionUser.orgId,
        orgCode: sessionUser.orgCode,
        orgName: sessionUser.orgName,
        orgAccent: sessionUser.orgAccent,
        loginMode: sessionUser.loginMode,
        type: 'api-token',
      },
      secret: AUTH_SECRET,
      maxAge: 60 * 60, // 1 hour
    })

    return NextResponse.json({
      success: true,
      token: apiToken,
      user: {
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.name,
        role: sessionUser.role,
        orgId: sessionUser.orgId,
        orgCode: sessionUser.orgCode,
        orgName: sessionUser.orgName,
        orgAccent: sessionUser.orgAccent,
        loginMode: sessionUser.loginMode,
      },
    })
  } catch (error) {
    console.error('[SESSION-TOKEN] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal error' },
      { status: 500 }
    )
  }
}

