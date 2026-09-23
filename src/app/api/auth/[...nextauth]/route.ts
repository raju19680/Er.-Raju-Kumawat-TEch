import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { NextRequest } from 'next/server'

// Wrap the NextAuth handler with login rate limiting
const handler = NextAuth(authOptions)

// Custom rate limit for login attempts: uses general rate limiter (30 per minute per IP)
const LOGIN_RATE_LIMIT_KEY = 'login'

async function rateLimitedHandler(req: NextRequest, context: any) {
  // Only rate-limit POST requests (sign-in attempts)
  if (req.method === 'POST') {
    const clientIp = getClientIp(req.headers)
    const rateLimitResult = checkRateLimit(`${LOGIN_RATE_LIMIT_KEY}:${clientIp}`)
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many login attempts. Please try again later.' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
  }

  return handler(req, context)
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST }
