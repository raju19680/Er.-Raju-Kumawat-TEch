import { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { db } from '@/lib/db'
import {
  sanitizeEmail,
  checkAccountLock,
  MAX_FAILED_ATTEMPTS,
  LOCK_DURATION_MINUTES,
} from '@/lib/auth-security'

/**
 * NextAuth configuration — shared across route handlers.
 *
 * IMPORTANT: This MUST be in a separate file (not inside the route handler)
 * because Next.js App Router module isolation can cause `getServerSession`
 * to fail when authOptions is imported from another route handler.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        orgId: { label: 'Organization ID', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        if (!credentials?.orgId) {
          throw new Error('Institute ID is required. Please enter your Institute ID first.')
        }

        // Sanitize input
        const email = sanitizeEmail(credentials.email)
        const providedOrgId = (credentials.orgId || '').trim()

        // ── Organization validation ──
        // Everyone MUST provide org ID — both super admin and teachers
        let matchedOrg = await db.organization.findUnique({
          where: { code: providedOrgId },
        })

        if (!matchedOrg) {
          // Try by ID (cuid) as fallback
          matchedOrg = await db.organization.findUnique({
            where: { id: providedOrgId },
          })
        }

        if (!matchedOrg) {
          throw new Error('Invalid Institute ID. Please check and try again.')
        }

        // Find the user
        const user = await db.user.findUnique({
          where: { email },
          include: { organization: true },
        })

        if (!user) {
          throw new Error('Invalid email or password')
        }

        // Verify user belongs to this organization
        if (user.organizationId !== matchedOrg.id) {
          throw new Error('You are not authorized to access this organization.')
        }

        // Check if account is locked
        const lockCheck = checkAccountLock(user.failedLoginAttempts, user.lockedUntil)
        if (lockCheck.locked) {
          // If lock expired, reset the counter before proceeding
          if (lockCheck.remainingMinutes === 0) {
            await db.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
              },
            })
          } else {
            throw new Error(
              `Account temporarily locked. Try again in ${lockCheck.remainingMinutes} minute${lockCheck.remainingMinutes !== 1 ? 's' : ''}.`
            )
          }
        }

        // Verify password
        const isValid = await compare(credentials.password, user.password)

        if (!isValid) {
          // Failed login: increment counter
          const newFailedCount = user.failedLoginAttempts + 1
          const lockUntil =
            newFailedCount >= MAX_FAILED_ATTEMPTS
              ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000)
              : user.lockedUntil

          await db.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: newFailedCount,
              lockedUntil: lockUntil,
            },
          })

          // Create failed login attempt record
          await db.loginAttempt.create({
            data: {
              email: user.email,
              success: false,
            },
          })

          // Specific message if account just got locked
          if (newFailedCount >= MAX_FAILED_ATTEMPTS) {
            throw new Error(
              `Account temporarily locked. Try again in ${LOCK_DURATION_MINUTES} minutes.`
            )
          }

          throw new Error('Invalid email or password')
        }

        // ── Successful login ──
        // Reset failed attempts, update last login
        await db.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        })

        // Create successful login attempt record
        await db.loginAttempt.create({
          data: {
            email: user.email,
            success: true,
          },
        })

        // All users are org-based now (including platform_admin)
        if (!user.organizationId || !user.organization) {
          throw new Error('Your account is not linked to any organization. Please contact support.')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          orgId: user.organization.id,
          orgCode: user.organization.code,
          orgName: user.organization.name,
          orgAccent: user.organization.accentColor,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.orgId = (user as any).orgId
        token.orgCode = (user as any).orgCode
        token.orgName = (user as any).orgName
        token.orgAccent = (user as any).orgAccent
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).orgId = token.orgId
        ;(session.user as any).orgCode = token.orgCode
        ;(session.user as any).orgName = token.orgName
        ;(session.user as any).orgAccent = token.orgAccent
      }
      return session
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  secret: process.env.NEXTAUTH_SECRET || 'er-raju-kumawat-tech-secret-key-2024',
}
