import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/auth/debug-cookies
 *
 * Debug endpoint that returns all cookies and headers from the request.
 * This helps diagnose cookie/auth issues in the browser.
 * Only available in development.
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  const allCookies: Record<string, string> = {}
  req.cookies.getAll().forEach(c => {
    allCookies[c.name] = c.value.substring(0, 50) + (c.value.length > 50 ? '...' : '')
  })

  const headers: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    headers[key] = value.substring(0, 100)
  })

  return NextResponse.json({
    cookies: allCookies,
    hasSessionToken: req.cookies.has('next-auth.session-token'),
    hasSecureSessionToken: req.cookies.has('__Secure-next-auth.session-token'),
    headers,
    url: req.url,
    method: req.method,
  })
}
