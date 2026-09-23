import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decode } from 'next-auth/jwt'

const AUTH_SECRET = process.env.NEXTAUTH_SECRET

if (!AUTH_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('NEXTAUTH_SECRET environment variable is required in production')
}

const FALLBACK_SECRET = process.env.NODE_ENV === 'production' 
  ? AUTH_SECRET! 
  : (AUTH_SECRET || 'dev-only-fallback-secret-change-in-production')

const SKIP_PATHS = [
  '/api/auth/callback',
  '/api/auth/session',
  '/api/auth/csrf',
  '/api/auth/providers',
  '/api/auth/direct-login',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-org',
  '/api/public/', // Public routes don't need auth
]

function safeHeader(value: string): string {
  if (/^[\x00-\xFF]*$/.test(value)) return value
  return encodeURIComponent(value)
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }
  
  return response
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Add security headers to ALL responses
  let response = NextResponse.next()
  
  if (!pathname.startsWith('/api/')) {
    return addSecurityHeaders(response)
  }

  if (SKIP_PATHS.some(p => pathname.startsWith(p))) {
    return addSecurityHeaders(NextResponse.next())
  }

  // ── Strategy 1: x-auth-token header (most reliable for cross-origin) ──
  const authToken = req.headers.get('x-auth-token')
  if (authToken) {
    try {
      const decoded = await decode({ token: authToken, secret: FALLBACK_SECRET })
      if (decoded && decoded.email) {
        const requestHeaders = new Headers(req.headers)
        requestHeaders.set('x-auth-verified', 'true')
        requestHeaders.set('x-auth-user-id', safeHeader((decoded.id as string) || (decoded.sub as string) || ''))
        requestHeaders.set('x-auth-user-email', safeHeader((decoded.email as string) || ''))
        requestHeaders.set('x-auth-user-name', safeHeader((decoded.name as string) || ''))
        requestHeaders.set('x-auth-user-role', safeHeader((decoded.role as string) || ''))
        requestHeaders.set('x-auth-user-org-id', safeHeader((decoded.orgId as string) || ''))
        requestHeaders.set('x-auth-user-org-code', safeHeader((decoded.orgCode as string) || ''))
        requestHeaders.set('x-auth-user-org-name', safeHeader((decoded.orgName as string) || ''))
        requestHeaders.set('x-auth-user-org-accent', safeHeader((decoded.orgAccent as string) || ''))
        requestHeaders.set('x-auth-user-login-mode', safeHeader((decoded.loginMode as string) || ''))
        return addSecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }))
      }
    } catch {}
  }

  // ── Strategy 2: erkt_api_token cookie ──
  const cookieToken = req.cookies.get('erkt_api_token')?.value
  if (cookieToken && cookieToken.length > 20) {
    try {
      const decoded = await decode({ token: cookieToken, secret: FALLBACK_SECRET })
      if (decoded && decoded.email) {
        const requestHeaders = new Headers(req.headers)
        requestHeaders.set('x-auth-verified', 'true')
        requestHeaders.set('x-auth-user-id', safeHeader((decoded.id as string) || (decoded.sub as string) || ''))
        requestHeaders.set('x-auth-user-email', safeHeader((decoded.email as string) || ''))
        requestHeaders.set('x-auth-user-name', safeHeader((decoded.name as string) || ''))
        requestHeaders.set('x-auth-user-role', safeHeader((decoded.role as string) || ''))
        requestHeaders.set('x-auth-user-org-id', safeHeader((decoded.orgId as string) || ''))
        requestHeaders.set('x-auth-user-org-code', safeHeader((decoded.orgCode as string) || ''))
        requestHeaders.set('x-auth-user-org-name', safeHeader((decoded.orgName as string) || ''))
        requestHeaders.set('x-auth-user-org-accent', safeHeader((decoded.orgAccent as string) || ''))
        requestHeaders.set('x-auth-user-login-mode', safeHeader((decoded.loginMode as string) || ''))
        return addSecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }))
      }
    } catch {}
  }

  // ── Strategy 3: NextAuth session cookie ──
  const sessionToken =
    req.cookies.get('next-auth.session-token')?.value ||
    req.cookies.get('__Secure-next-auth.session-token')?.value

  if (!sessionToken) {
    return addSecurityHeaders(NextResponse.next())
  }

  try {
    const decoded = await decode({ token: sessionToken, secret: FALLBACK_SECRET })
    if (!decoded || !decoded.email) {
      return addSecurityHeaders(NextResponse.next())
    }
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-auth-verified', 'true')
    requestHeaders.set('x-auth-user-id', safeHeader((decoded.id as string) || (decoded.sub as string) || ''))
    requestHeaders.set('x-auth-user-email', safeHeader((decoded.email as string) || ''))
    requestHeaders.set('x-auth-user-name', safeHeader((decoded.name as string) || ''))
    requestHeaders.set('x-auth-user-role', safeHeader((decoded.role as string) || ''))
    requestHeaders.set('x-auth-user-org-id', safeHeader((decoded.orgId as string) || ''))
    requestHeaders.set('x-auth-user-org-code', safeHeader((decoded.orgCode as string) || ''))
    requestHeaders.set('x-auth-user-org-name', safeHeader((decoded.orgName as string) || ''))
    requestHeaders.set('x-auth-user-org-accent', safeHeader((decoded.orgAccent as string) || ''))
    requestHeaders.set('x-auth-user-login-mode', safeHeader((decoded.loginMode as string) || ''))
    return addSecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }))
  } catch {
    return addSecurityHeaders(NextResponse.next())
  }
}

export const config = {
  matcher: ['/api/:path*'],
}
