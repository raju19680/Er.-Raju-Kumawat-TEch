import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getAuthUser } from '@/lib/auth-helpers'

/**
 * GET /api/auth/debug
 *
 * Debug endpoint to diagnose authentication issues.
 * Shows the state of each auth strategy.
 * Only available in development.
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const debug: Record<string, any> = {}

  // Check 1: x-auth-token header
  const authToken = req.headers.get('x-auth-token')
  debug.xAuthToken = authToken ? 'present (length: ' + authToken.length + ')' : 'not present'

  // Check 2: Authorization header
  const authHeader = req.headers.get('authorization')
  debug.authorizationHeader = authHeader ? 'present' : 'not present'

  // Check 3: getServerSession
  try {
    const session = await getServerSession(authOptions)
    debug.getServerSession = session?.user
      ? { email: (session.user as any).email, role: (session.user as any).role, loginMode: (session.user as any).loginMode }
      : 'no session'
  } catch (e: any) {
    debug.getServerSession = 'error: ' + e.message
  }

  // Check 4: getAuthUser (the combined function)
  try {
    const authUser = await getAuthUser(req)
    debug.getAuthUser = authUser
      ? { id: authUser.id, email: authUser.email, role: authUser.role, loginMode: authUser.loginMode }
      : 'null (not authenticated)'
  } catch (e: any) {
    debug.getAuthUser = 'error: ' + e.message
  }

  // Check 5: Cookies present in the request
  const cookieNames = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    '__Host-next-auth.session-token',
    'next-auth.csrf-token',
  ]
  debug.cookies = {}
  for (const name of cookieNames) {
    const cookie = req.cookies.get(name)
    debug.cookies[name] = cookie ? 'present (length: ' + cookie.value.length + ')' : 'not present'
  }

  // Check 6: Request headers
  debug.requestHeaders = {
    host: req.headers.get('host'),
    origin: req.headers.get('origin'),
    referer: req.headers.get('referer'),
    'x-forwarded-for': req.headers.get('x-forwarded-for'),
    'x-forwarded-proto': req.headers.get('x-forwarded-proto'),
  }

  // Check 7: Environment
  debug.environment = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
    NODE_ENV: process.env.NODE_ENV,
  }

  return NextResponse.json({ debug }, { status: 200 })
}
