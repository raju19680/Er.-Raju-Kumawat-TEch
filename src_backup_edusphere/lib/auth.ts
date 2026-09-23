import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { db } from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'edusphere-secret-key-change-in-production'
const SESSION_COOKIE = 'edusphere_session'
const SESSION_DURATION = 7 * 24 * 60 * 60 // 7 days in seconds

export interface SessionUser {
  id: string
  email: string
  username: string
  name: string | null
  role: 'ADMIN' | 'TEACHER' | 'STUDENT'
  organisationId: string | null
  websiteSlug: string | null
  teacherStatus: string | null
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function createToken(user: SessionUser): string {
  return jwt.sign(
    { ...user, exp: Math.floor(Date.now() / 1000) + SESSION_DURATION },
    JWT_SECRET
  )
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionUser
    return decoded
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  
  const payload = verifyToken(token)
  if (!payload) return null
  
  // Verify user still exists in DB
  const user = await db.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      role: true,
      organisationId: true,
      websiteSlug: true,
      teacherStatus: true,
    },
  })
  
  if (!user) return null
  
  return {
    ...user,
    role: user.role as 'ADMIN' | 'TEACHER' | 'STUDENT',
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  return getSession()
}

// Seed default admin if none exists
export async function ensureAdminExists() {
  const adminCount = await db.user.count({ where: { role: 'ADMIN' } })
  if (adminCount === 0) {
    const hashedPassword = await hashPassword('admin123')
    await db.user.create({
      data: {
        email: 'admin@edusphere.com',
        username: 'admin',
        password: hashedPassword,
        name: 'Platform Admin',
        role: 'ADMIN',
      },
    })
    console.log('✅ Default admin created: admin@edusphere.com / admin123')
  }
}
