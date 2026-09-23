export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { db } from '@/lib/db'
import { validatePasswordStrength, sanitizeEmail, sanitizeInput } from '@/lib/auth-security'
import { requirePlatformAdmin } from '@/lib/auth-helpers'
import { ALL_ACCESS_KEYS } from '@/lib/module-registry'

/**
 * Create a new teacher AND their organization (platform) in one transaction.
 * Only accessible by platform_admin.
 * Since teacher = org, creating a teacher automatically creates their platform.
 */
export async function POST(req: NextRequest) {
  try {
    // ── Auth check: Must be platform_admin ──
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const {
      name,
      email,
      password,
      phone,
      platformName,
      platformId,
      accentColor,
      adminCommission,
      gatewayCharge,
      razorpayAccountId,
      status,
    } = await req.json()

    // ── Input validation ──
    if (!name || !email || !password || !platformName) {
      return NextResponse.json(
        { success: false, message: 'Teacher name, email, password, and platform name are required.' },
        { status: 400 }
      )
    }

    if (!platformId) {
      return NextResponse.json(
        { success: false, message: 'Platform ID is required. Students use this to login.' },
        { status: 400 }
      )
    }

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

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name)
    const sanitizedEmail = sanitizeEmail(email)
    const sanitizedPhone = phone ? sanitizeInput(phone) : undefined
    const sanitizedPlatformName = sanitizeInput(platformName)
    const sanitizedPlatformId = platformId.trim().toUpperCase()

    // Validate and set defaults for numeric fields
    const commissionValue = typeof adminCommission === 'number' ? adminCommission : 20
    const gatewayValue = typeof gatewayCharge === 'number' ? gatewayCharge : 2.36

    // Validate status
    const validStatuses = ['active', 'inactive', 'trial']
    const statusValue = status && validStatuses.includes(status) ? status : 'trial'

    // ── Check for existing user ──
    const existingUser = await db.user.findUnique({
      where: { email: sanitizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'A user with this email already exists.' },
        { status: 409 }
      )
    }

    // ── Check for existing platform ID ──
    const existingOrg = await db.organization.findUnique({
      where: { code: sanitizedPlatformId },
    })

    if (existingOrg) {
      return NextResponse.json(
        { success: false, message: 'A platform with this ID already exists. Please choose a different ID.' },
        { status: 409 }
      )
    }

    // ── Create Organization + Teacher User in a transaction ──
    const result = await db.$transaction(async (tx) => {
      // 1. Create the Organization (platform)
      const organization = await tx.organization.create({
        data: {
          name: sanitizedPlatformName,
          code: sanitizedPlatformId,
          accentColor: accentColor || '#d97706',
          adminCommission: commissionValue,
          gatewayCharge: gatewayValue,
          razorpayAccountId: razorpayAccountId || null,
          status: statusValue,
        },
      })

      // 2. Hash the password
      const hashedPassword = await hash(password, 12)

      // 3. Create the Teacher User linked to this organization
      const user = await tx.user.create({
        data: {
          name: sanitizedName,
          email: sanitizedEmail,
          phone: sanitizedPhone || null,
          password: hashedPassword,
          role: 'teacher',
          organizationId: organization.id,
          failedLoginAttempts: 0,
          lockedUntil: null,
          passwordChangedAt: new Date(),
        },
      })

      return { organization, user }
    })

    // Create default module access records (all enabled) for the new teacher
    const accessRecords = ALL_ACCESS_KEYS.map(key => ({
      teacherId: result.user.id,
      moduleKey: key,
      enabled: true,
      updatedBy: authResult.user.id,
    }))

    await db.teacherModuleAccess.createMany({ data: accessRecords })

    return NextResponse.json({
      success: true,
      message: 'Teacher and platform created successfully!',
      data: {
        teacher: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
          role: result.user.role,
        },
        platform: {
          id: result.organization.id,
          name: result.organization.name,
          code: result.organization.code,
          accentColor: result.organization.accentColor,
          status: result.organization.status,
          adminCommission: result.organization.adminCommission,
          gatewayCharge: result.organization.gatewayCharge,
          razorpayAccountId: result.organization.razorpayAccountId,
        },
      },
    })
  } catch (error) {
    console.error('Create teacher error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
