import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'

/**
 * GET /api/auth/me
 *
 * Returns the current user info from the JWT token.
 * This is used by the frontend to populate the Zustand store after login.
 *
 * Checks x-auth-token header FIRST (most reliable in cross-origin preview),
 * then falls back to cookie-based session.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req)

    if (!auth) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      user: auth,
    })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}

/**
 * POST /api/auth/me
 *
 * Alternative endpoint that accepts the token in the request body.
 * This is a fallback for when the x-auth-token header isn't sent
 * (e.g., in some cross-origin scenarios).
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req)

    if (!auth) {
      // Try reading token from body
      try {
        const body = await req.json()
        if (body?.token) {
          // Re-check with token from body by setting it as header
          const headers = new Headers(req.headers)
          headers.set('x-auth-token', body.token)
          const newReq = new NextRequest(req.url, { headers })
          const authFromToken = await getAuthUser(newReq)
          if (authFromToken) {
            return NextResponse.json({
              authenticated: true,
              user: authFromToken,
            })
          }
        }
      } catch {}
      
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      user: auth,
    })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}
