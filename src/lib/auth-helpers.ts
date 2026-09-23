import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { getToken, decode } from 'next-auth/jwt'
import { authOptions } from '@/lib/auth-options'
import { db } from '@/lib/db'

// IMPORTANT: This must match the NEXTAUTH_SECRET in .env exactly.
// The .env file has: NEXTAUTH_SECRET=er-raju-kumawat-tech-secret-key-2024
// The fallback here only applies when .env is not loaded (shouldn't happen in practice).
const AUTH_SECRET = process.env.NEXTAUTH_SECRET || 'er-raju-kumawat-tech-secret-key-2024'

const cookieNames = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
  '__Host-next-auth.session-token',
]

interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  orgId: string
  orgCode: string
  orgName: string
  orgAccent: string
  loginMode: string
}

function tokenToUser(token: any): AuthUser | null {
  if (!token || !token.email) return null
  return {
    id: (token.id || token.sub) as string,
    email: token.email as string,
    name: token.name as string,
    role: token.role as string,
    orgId: (token.orgId || token.organizationId) as string,
    orgCode: (token.orgCode || token.organizationId) as string,
    orgName: token.orgName as string,
    orgAccent: token.orgAccent as string,
    loginMode: token.loginMode as string,
  }
}

/**
 * Decode a header value that was encoded by middleware's safeHeader().
 * If the value was percent-encoded (contains %XX sequences), decode it.
 * Otherwise return as-is.
 */
function decodeHeaderValue(value: string): string {
  try {
    // Check if the value looks percent-encoded (contains % followed by hex digits)
    if (/%[0-9A-Fa-f]{2}/.test(value)) {
      return decodeURIComponent(value)
    }
    return value
  } catch {
    return value
  }
}

/**
 * Read user info from middleware-injected headers.
 *
 * The Next.js middleware reads the NextAuth JWT from cookies and
 * injects user info as x-auth-user-* headers. This is the most
 * reliable way to get auth info in API routes because middleware
 * has direct access to request cookies.
 */
function readFromMiddlewareHeaders(req: NextRequest | Request): AuthUser | null {
  const verified = req.headers.get('x-auth-verified')
  if (verified !== 'true') return null

  const email = decodeHeaderValue(req.headers.get('x-auth-user-email') || '')
  if (!email) return null

  return {
    id: decodeHeaderValue(req.headers.get('x-auth-user-id') || ''),
    email,
    name: decodeHeaderValue(req.headers.get('x-auth-user-name') || ''),
    role: decodeHeaderValue(req.headers.get('x-auth-user-role') || ''),
    orgId: decodeHeaderValue(req.headers.get('x-auth-user-org-id') || ''),
    orgCode: decodeHeaderValue(req.headers.get('x-auth-user-org-code') || ''),
    orgName: decodeHeaderValue(req.headers.get('x-auth-user-org-name') || ''),
    orgAccent: decodeHeaderValue(req.headers.get('x-auth-user-org-accent') || ''),
    loginMode: decodeHeaderValue(req.headers.get('x-auth-user-login-mode') || ''),
  }
}

/**
 * Get the authenticated user from the current request context.
 *
 * Uses multiple strategies to reliably read the session in Next.js App Router:
 *
 * 0. Middleware headers — Next.js middleware reads the JWT cookie and
 *    injects user info as x-auth-user-* headers. Most reliable.
 *
 * 1. x-auth-token header — client explicitly sends the JWT.
 *
 * 2. getServerSession(authOptions) — reads cookies via next/headers.
 *
 * 3. getToken({ req }) — reads JWT from request cookie.
 *
 * 4. Manual cookie header parsing + JWT decode — last resort.
 */
export async function getAuthUser(req?: NextRequest | Request): Promise<AuthUser | null> {
  try {
    // ── Strategy 1: x-auth-token header (MOST RELIABLE for cross-origin) ──
    // Check this FIRST because it works even when cookies don't persist
    if (req) {
      const authToken = req.headers.get('x-auth-token')
      if (authToken) {
        try {
          const decoded = await decode({
            token: authToken,
            secret: AUTH_SECRET,
          })
          const user = tokenToUser(decoded)
          if (user) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`[AUTH] Strategy 1 (x-auth-token) success: email=${user.email}, role=${user.role}`)
            }
            return user
          }
        } catch (e) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[AUTH] Strategy 1 (x-auth-token) failed:', e instanceof Error ? e.message : e)
          }
        }
      }
    }

    // ── Strategy 0: Middleware headers (fallback) ──
    if (req) {
      const user = readFromMiddlewareHeaders(req)
      if (user) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[AUTH] Strategy 0 (middleware headers) success: email=${user.email}, role=${user.role}`)
        }
        return user
      }
    }

    // ── Strategy 2: getServerSession ──
    try {
      const session = await getServerSession(authOptions)
      if (session?.user) {
        const user = tokenToUser(session.user)
        if (user) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[AUTH] Strategy 2 (getServerSession) success: email=${user.email}, role=${user.role}`)
          }
          return user
        }
      }
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AUTH] Strategy 2 (getServerSession) failed:', e instanceof Error ? e.message : e)
      }
    }

    // ── Strategy 3: getToken() from request ──
    if (req) {
      try {
        const isSecureViaHeader = req.headers.get('x-forwarded-proto') === 'https'

        let token = await getToken({
          req: req as any,
          secret: AUTH_SECRET,
          secureCookie: isSecureViaHeader,
        })

        if (!token) {
          token = await getToken({
            req: req as any,
            secret: AUTH_SECRET,
            secureCookie: !isSecureViaHeader,
          })
        }

        if (token) {
          const user = tokenToUser(token)
          if (user) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`[AUTH] Strategy 3 (getToken) success: email=${user.email}, role=${user.role}`)
            }
            return user
          }
        }
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AUTH] Strategy 3 (getToken) failed:', e instanceof Error ? e.message : e)
        }
      }

      // ── Strategy 4: Manual cookie reading + decode ──
      try {
        const manualResult = await readTokenFromCookieManually(req)
        if (manualResult) {
          const user = tokenToUser(manualResult)
          if (user) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`[AUTH] Strategy 4 (manual cookie) success: email=${user.email}, role=${user.role}`)
            }
            return user
          }
        }
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AUTH] Strategy 4 (manual cookie) failed:', e instanceof Error ? e.message : e)
        }
      }
    }

    // All authentication strategies failed
    return null
  } catch (error) {
    console.error('[AUTH] getAuthUser error:', error)
    return null
  }
}

/**
 * Manually read the session cookie and decode the JWT.
 */
async function readTokenFromCookieManually(req: NextRequest | Request): Promise<any> {
  try {
    let sessionToken: string | undefined

    if ('cookies' in req && typeof (req as NextRequest).cookies?.get === 'function') {
      for (const name of cookieNames) {
        const cookie = (req as NextRequest).cookies.get(name)
        if (cookie?.value) {
          sessionToken = cookie.value
          break
        }
      }
    }

    if (!sessionToken) {
      const cookieHeader = req.headers.get('cookie') || ''
      const cookies = cookieHeader.split(';').map(c => c.trim())
      for (const cookie of cookies) {
        for (const name of cookieNames) {
          if (cookie.startsWith(`${name}=`)) {
            sessionToken = cookie.substring(name.length + 1)
            break
          }
        }
        if (sessionToken) break
      }
    }

    if (!sessionToken) return null

    const decoded = await decode({
      token: sessionToken,
      secret: AUTH_SECRET,
    })

    return decoded
  } catch (error) {
    console.error('[AUTH] Manual cookie read error:', error)
    return null
  }
}

/**
 * Require platform_admin role. Returns the auth user or an error object.
 */
export async function requirePlatformAdmin(req?: NextRequest | Request) {
  const auth = await getAuthUser(req)
  if (!auth) return { error: 'Authentication required.' as const, status: 401 as const }
  const normalizedRole = String(auth.role).toLowerCase()
  if (!['platform_admin', 'org_admin', 'admin'].includes(normalizedRole)) {
    return { error: 'Access denied. Only platform admins can perform this action.' as const, status: 403 as const }
  }
  return { user: auth }
}

/**
 * Require teacher or admin role. Returns the auth user or an error object.
 */
export async function requireAdminOrTeacher(req?: NextRequest | Request) {
  const auth = await getAuthUser(req)
  if (!auth) return { error: 'Authentication required.' as const, status: 401 as const }
  const allowed = ['platform_admin', 'org_admin', 'teacher', 'admin']
  if (!allowed.includes(String(auth.role).toLowerCase())) {
    return { error: `Access denied. Only administrators and teachers can perform this action. (Your role: ${auth.role})` as any, status: 403 as const }
  }
  return { user: auth }
}

/**
 * Require teacher role. Returns the auth user or an error object.
 */
export async function requireTeacher(req?: NextRequest | Request) {
  const auth = await getAuthUser(req)
  if (!auth) return { error: 'Authentication required.' as const, status: 401 as const }
  if (auth.role !== 'teacher') return { error: 'Access denied. Only teachers can perform this action.' as const, status: 403 as const }
  return { user: auth }
}

/**
 * Require any authenticated user. Returns the auth user or an error object.
 */
export async function requireAuth(req?: NextRequest | Request) {
  const auth = await getAuthUser(req)
  if (!auth) return { error: 'Authentication required.' as const, status: 401 as const }
  return { user: auth }
}

/**
 * Require student role and return both auth user and the database student record.
 * Automatically handles student profile linking or auto-creation if needed.
 */
export async function getAuthStudent(req?: NextRequest | Request) {
  const auth = await getAuthUser(req)
  if (!auth) {
    return { auth: null, student: null, error: 'Authentication required' as const, status: 401 as const }
  }
  if (auth.role !== 'student') {
    const isTeacher = ['teacher', 'org_admin', 'admin', 'platform_admin'].includes(String(auth.role).toLowerCase())
    if (isTeacher) {
      return { 
        auth, 
        student: { id: 'admin-bypass', name: auth.name, email: auth.email, organizationId: auth.orgId } as any, 
        error: null, 
        status: 200 as const 
      }
    }
    return { auth, student: null, error: 'Access denied. Student account required.' as const, status: 403 as const }
  }

  try {
    // 1. Try to find student by userId
    let student = await db.student.findFirst({
      where: { userId: auth.id },
    })

    // 2. If not found by userId, try finding by email
    if (!student && auth.email) {
      if (auth.orgId) {
        student = await db.student.findFirst({
          where: {
            email: auth.email,
            organizationId: auth.orgId,
          },
        })
      }
      if (!student) {
        student = await db.student.findFirst({
          where: { email: auth.email },
        })
      }
      if (student) {
        student = await db.student.update({
          where: { id: student.id },
          data: {
            userId: auth.id,
            ...(auth.orgId && !student.organizationId ? { organizationId: auth.orgId } : {}),
          },
        })
      }
    }

    // 3. If still not found, resolve organizationId and auto-create student record
    if (!student) {
      let targetOrgId = auth.orgId
      if (!targetOrgId && auth.id) {
        const userRec = await db.user.findUnique({
          where: { id: auth.id },
          select: { organizationId: true },
        })
        if (userRec?.organizationId) {
          targetOrgId = userRec.organizationId
        }
      }
      if (!targetOrgId) {
        const defaultOrg = await db.organization.findFirst({
          select: { id: true },
        })
        if (defaultOrg) {
          targetOrgId = defaultOrg.id
        }
      }

      if (targetOrgId) {
        student = await db.student.create({
          data: {
            userId: auth.id,
            name: auth.name || (auth.email ? auth.email.split('@')[0] : 'Student'),
            email: auth.email || `student_${auth.id}@portal.local`,
            organizationId: targetOrgId,
            isActive: true,
          },
        })
      }
    }

    if (!student) {
      return { auth, student: null, error: 'Student profile not found' as const, status: 404 as const }
    }

    if (student.isBlocked) {
      return {
        auth,
        student,
        error: student.blockedReason || 'Your student account has been blocked. Please contact institute administration.',
        status: 403 as const,
      }
    }

    return { auth, student, error: null, status: 200 as const }
  } catch (error) {
    console.error('[AUTH] getAuthStudent error:', error)
    return { auth, student: null, error: 'Failed to retrieve student profile' as const, status: 500 as const }
  }
}



export async function getAuthTeacher(req) {
  const result = await requireTeacher(req);
  if (result.error) return { auth: null, teacher: null, error: result.error, status: result.status };
  return { auth: result.user, teacher: result.user, error: null, status: 200 };
}
