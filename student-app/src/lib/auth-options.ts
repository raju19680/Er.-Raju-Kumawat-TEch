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
import { verifyTOTP, verifyBackupCode } from '@/lib/totp'

/**
 * NextAuth configuration — shared between the route handler and API routes.
 *
 * IMPORTANT: This file must be separate from the route handler so that
 * `getServerSession(authOptions)` can import it in API routes without
 * triggering route-handler-only code paths.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        orgId: { label: 'Organization ID', type: 'text' },
        twoFactorCode: { label: '2FA Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        if (!credentials?.orgId || !credentials.orgId.trim()) {
          throw new Error('Institute ID is required')
        }

        const email = sanitizeEmail(credentials.email)
        const providedOrgId = credentials.orgId.trim()

        // ── Step 1: Verify Organization exists ──
        const orgByCode = await db.organization.findUnique({
          where: { code: providedOrgId },
        })
        const orgById = !orgByCode ? await db.organization.findUnique({
          where: { id: providedOrgId },
        }) : null
        const matchedOrg = orgByCode || orgById

        if (!matchedOrg) {
          await new Promise(r => setTimeout(r, 100))
          throw new Error('Invalid Institute ID. Please check and try again.')
        }

        // ── Step 2: Find user ──
        const user = await db.user.findUnique({
          where: { email },
          include: { organization: true },
        })

        if (!user) {
          await new Promise(r => setTimeout(r, 100))
          throw new Error('Invalid email or password')
        }

        // ── Step 3: Verify user belongs to this organization ──
        // Platform admins can log in with ANY organization's code (they oversee all orgs)
        if (user.role !== 'platform_admin' && user.organizationId !== matchedOrg.id) {
          await new Promise(r => setTimeout(r, 100))
          throw new Error('You are not authorized to access this institute.')
        }

        // ── Step 4: Check account lock ──
        const lockCheck = checkAccountLock(user.failedLoginAttempts, user.lockedUntil)
        if (lockCheck.locked) {
          if (lockCheck.remainingMinutes === 0) {
            await db.user.update({
              where: { id: user.id },
              data: { failedLoginAttempts: 0, lockedUntil: null },
            })
          } else {
            throw new Error(
              `Account temporarily locked. Try again in ${lockCheck.remainingMinutes} minute${lockCheck.remainingMinutes !== 1 ? 's' : ''}.`
            )
          }
        }

        // ── Step 5: Verify password ──
        const isValid = await compare(credentials.password, user.password)

        if (!isValid) {
          await new Promise(r => setTimeout(r, 100))

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

          await db.loginAttempt.create({
            data: { email: user.email, success: false },
          })

          if (newFailedCount >= MAX_FAILED_ATTEMPTS) {
            throw new Error(
              `Account temporarily locked. Try again in ${LOCK_DURATION_MINUTES} minutes.`
            )
          }

          throw new Error('Invalid email or password')
        }

        // ── Step 6: Check Two-Factor Authentication ──
        if (user.twoFactorEnabled && user.twoFactorSecret) {
          const twoFactorCode = credentials.twoFactorCode

          if (!twoFactorCode) {
            // Signal to client that 2FA is required
            throw new Error('2FA_REQUIRED')
          }

          // Verify TOTP code
          const isValidTOTP = verifyTOTP(user.twoFactorSecret, twoFactorCode)

          if (!isValidTOTP) {
            // Try backup code
            if (user.twoFactorBackupCodes) {
              const result = verifyBackupCode(twoFactorCode, user.twoFactorBackupCodes)
              if (result.valid) {
                // Remove used backup code
                await db.user.update({
                  where: { id: user.id },
                  data: { twoFactorBackupCodes: JSON.stringify(result.remainingCodes) },
                })
                if (process.env.NODE_ENV === 'development') {
                  console.log(`[AUTH] Backup code used for: ${user.email}. Remaining: ${result.remainingCodes.length}`)
                }
              } else {
                await db.loginAttempt.create({
                  data: { email: user.email, success: false },
                })
                throw new Error('Invalid 2FA verification code')
              }
            } else {
              await db.loginAttempt.create({
                data: { email: user.email, success: false },
              })
              throw new Error('Invalid 2FA verification code')
            }
          }

          if (process.env.NODE_ENV === 'development') {
            console.log(`[AUTH] 2FA verified for: ${user.email}`)
          }
        }

        // ── Step 7: Successful login ──
        await db.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
        })

        await db.loginAttempt.create({
          data: { email: user.email, success: true },
        })

        // ── Step 8: Role-based login mode ──
        // platform_admin → Admin Portal (loginMode: 'admin')
        // teacher → CMS Portal (loginMode: 'cms')
        // student → Student Portal (loginMode: 'student')
        // Role is NEVER changed — it stays exactly as stored in the database

        // For platform_admin, use the matchedOrg if they don't have an organization linked
        // (they oversee ALL organizations, so any valid org works)
        const effectiveOrg = user.organization || matchedOrg

        if (!effectiveOrg) {
          throw new Error('Your account is not linked to any institute. Please contact support.')
        }

        // Auto-fix: If platform_admin has no organizationId, link them to the matched org
        if (user.role === 'platform_admin' && !user.organizationId && matchedOrg) {
          await db.user.update({
            where: { id: user.id },
            data: { organizationId: matchedOrg.id },
          })
          if (process.env.NODE_ENV === 'development') {
            console.log(`[AUTH] Auto-linked platform_admin ${user.email} to org ${matchedOrg.code}`)
          }
        }

        const loginMode = user.role === 'platform_admin' ? 'admin' : user.role === 'student' ? 'student' : 'cms'

        if (process.env.NODE_ENV === 'development') {
          console.log(`[AUTH] User authenticated: ${user.email} | Role: ${user.role} | LoginMode: ${loginMode}`)
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          orgId: effectiveOrg.id,
          orgCode: effectiveOrg.code,
          orgName: effectiveOrg.name,
          orgAccent: effectiveOrg.accentColor,
          loginMode,
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
        token.loginMode = (user as any).loginMode || 'cms'
        // JWT token created (debug only)
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
        ;(session.user as any).loginMode = token.loginMode
        // Session created (debug only)
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
    updateAge: 2 * 60 * 60, // Refetch session data every 2 hours (keeps maxAge fresh)
  },
  jwt: {
    maxAge: 8 * 60 * 60, // 8 hours — must match session maxAge
  },
  secret: process.env.NEXTAUTH_SECRET || 'er-raju-kumawat-tech-secret-key-2024',
  debug: process.env.NODE_ENV === 'development',
}
