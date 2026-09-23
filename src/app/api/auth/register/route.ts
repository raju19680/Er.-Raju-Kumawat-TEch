import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { db } from '@/lib/db'
import { validatePasswordStrength, sanitizeEmail, sanitizeInput } from '@/lib/auth-security'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { getAuthUser } from '@/lib/auth-helpers'
import { z } from 'zod'

/**
 * Create a new user account.
 * Allows public self-registration for students (no auth required).
 * Teachers/admins can also create accounts when authenticated.
 * Only 3 roles exist: platform_admin, teacher, student
 */
export async function POST(req: NextRequest) {
  try {
    // ── Auth check (optional) ──
    // Public registration is ALLOWED for students
    // Authenticated admins/teachers can create any role
    const authUser = await getAuthUser(req)
    const isPlatformAdmin = authUser?.role === 'platform_admin'
    const isTeacher = authUser?.role === 'teacher'
    const isPublicRegistration = !authUser

    // ── Rate limiting with brute-force cooldown ──
    const clientIp = getClientIp(req.headers)
    const rateLimitResult = checkRateLimit(clientIp, 'auth')

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many registration attempts. Please wait ${rateLimitResult.retryAfter} seconds.`,
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter),
          },
        }
      )
    }

    const body = await req.json()
    const registerSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email format'),
      password: z.string().min(6, 'Password is too short'),
      orgCode: z.string().optional(),
      orgId: z.string().optional(),
      role: z.string().optional(),
      phone: z.string().optional(),
      teacherId: z.string().optional()
    })
    
    const parseResult = registerSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid input data', details: parseResult.error.format() },
        { status: 400 }
      )
    }

    const { name, email, password, orgCode: inputOrgCode, orgId: inputOrgId, role, phone, teacherId } = parseResult.data
    const rawOrg = (inputOrgCode || inputOrgId || '').trim()
    
    // Clean & validate mandatory 10-digit mobile number for all registrations
    const cleanPhone = (phone || '').toString().trim().replace(/[^0-9]/g, '')
    const formattedPhone = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone
    if (!formattedPhone || formattedPhone.length !== 10) {
      return NextResponse.json(
        { success: false, message: 'A valid 10-digit mobile number is mandatory for registration' },
        { status: 400 }
      )
    }

    // ── Role restriction ──
    // Only 3 roles: platform_admin, teacher, student
    // Public registration can only create student accounts
    // Platform admin can create teacher & student
    // Teacher can only create student accounts
    const allowedRoles = isPlatformAdmin
      ? ['teacher', 'student']
      : ['student']  // Both teachers and public can create student accounts

    if (role && !allowedRoles.includes(role)) {
      return NextResponse.json(
        { success: false, message: `You can only create ${allowedRoles.join(' or ')} accounts.` },
        { status: 403 }
      )
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name)
    const sanitizedEmail = sanitizeEmail(email)

    // ── Password strength check ──
    const strength = validatePasswordStrength(password)
    if (strength.score < 2) {
      return NextResponse.json(
        {
          success: false,
          message: 'Password is too weak. Please choose a stronger password.',
          passwordStrength: {
            score: strength.score,
            label: strength.label,
            feedback: strength.feedback,
          },
        },
        { status: 400 }
      )
    }

    // Check if user with email already exists
    const existingUser = await db.user.findUnique({
      where: { email: sanitizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Check if mobile number already exists
    const existingPhone = await db.user.findFirst({
      where: { phone: formattedPhone },
    })

    if (existingPhone) {
      return NextResponse.json(
        { success: false, message: 'An account with this mobile number already exists' },
        { status: 409 }
      )
    }

    // Determine organization
    let organizationId: string | null = null

    if (isPlatformAdmin && rawOrg) {
      // Platform admin can specify any org
      const org = (await db.organization.findUnique({ where: { code: rawOrg } })) ||
                  (await db.organization.findUnique({ where: { id: rawOrg } }))
      if (!org) {
        return NextResponse.json(
          { success: false, message: 'Organization not found' },
          { status: 404 }
        )
      }
      organizationId = org.id
    } else if (isTeacher) {
      // Teacher can only create users in their own org
      organizationId = authUser!.orgId
    } else if (isPublicRegistration && rawOrg) {
      // Public registration: find org by code or id
      const org = (await db.organization.findUnique({ where: { code: rawOrg } })) ||
                  (await db.organization.findUnique({ where: { id: rawOrg } }))
      if (!org) {
        return NextResponse.json(
          { success: false, message: 'Organization not found' },
          { status: 404 }
        )
      }
      organizationId = org.id
    }

    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: 'Institute ID is required. Please specify an organization.' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user
    const user = await db.user.create({
      data: {
        name: sanitizedName,
        email: sanitizedEmail,
        password: hashedPassword,
        role: role || 'student',
        organizationId: organizationId,
        phone: formattedPhone,
        failedLoginAttempts: 0,
        lockedUntil: null,
        passwordChangedAt: new Date(),
      },
    })

    // If role is student, create a student profile
    if (user.role === 'student') {
      let assignedTeacherId: string | null = null
      if (isTeacher) {
        assignedTeacherId = authUser!.id
      } else if (teacherId) {
        const teacher = await db.user.findFirst({
          where: { id: teacherId, organizationId, role: 'teacher' },
        })
        if (teacher) {
          assignedTeacherId = teacher.id
        }
      }
      
      if (!assignedTeacherId) {
        const teacher = await db.user.findFirst({
          where: { organizationId, role: 'teacher' },
          orderBy: { createdAt: 'asc' }
        })
        if (teacher) {
          assignedTeacherId = teacher.id
        }
      }

      await db.student.create({
        data: {
          name: sanitizedName,
          email: sanitizedEmail,
          phone: formattedPhone,
          userId: user.id,
          organizationId: organizationId,
          teacherId: assignedTeacherId,
        },
      })
    }

    // ── Send welcome email (fire and forget) ──
    ;(async () => {
      try {
        const org = await db.organization.findUnique({
          where: { id: organizationId! },
          select: { name: true, code: true },
        })
        if (org) {
          const { sendWelcomeEmail } = await import('@/lib/email')
          sendWelcomeEmail(
            sanitizedEmail,
            sanitizedName,
            org.name,
            org.code,
            organizationId || undefined
          )
        }
      } catch (emailErr) {
        console.log('[REGISTER] Welcome email failed:', emailErr)
      }
    })()

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
