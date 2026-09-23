export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeEmail, sanitizeInput } from '@/lib/auth-security'
import { requirePlatformAdmin } from '@/lib/auth-helpers'

/**
 * Edit a teacher and their organization (platform) data.
 * Only accessible by platform_admin.
 */
export async function PUT(req: NextRequest) {
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
      teacherId,
      // User fields
      name,
      email,
      phone,
      avatar,
      // Organization fields
      platformName,
      platformId,
      accentColor,
      status,
      adminCommission,
      gatewayCharge,
      razorpayAccountId,
    } = await req.json()

    // ── Validate teacherId ──
    if (!teacherId) {
      return NextResponse.json(
        { success: false, message: 'Teacher ID is required.' },
        { status: 400 }
      )
    }

    // ── Find the teacher ──
    const teacher = await db.user.findUnique({
      where: { id: teacherId },
      include: { organization: true },
    })

    if (!teacher || teacher.role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'Teacher not found.' },
        { status: 404 }
      )
    }

    // ── Validate email uniqueness if changing ──
    if (email && email !== teacher.email) {
      const sanitizedEmail = sanitizeEmail(email)
      const existingUser = await db.user.findUnique({
        where: { email: sanitizedEmail },
      })
      if (existingUser && existingUser.id !== teacherId) {
        return NextResponse.json(
          { success: false, message: 'A user with this email already exists.' },
          { status: 409 }
        )
      }
    }

    // ── Validate platform code uniqueness if changing ──
    if (platformId && teacher.organization && platformId !== teacher.organization.code) {
      const sanitizedCode = platformId.trim().toUpperCase()
      const existingOrg = await db.organization.findUnique({
        where: { code: sanitizedCode },
      })
      if (existingOrg && existingOrg.id !== teacher.organization.id) {
        return NextResponse.json(
          { success: false, message: 'A platform with this ID already exists. Please choose a different ID.' },
          { status: 409 }
        )
      }
    }

    // ── Build user update data ──
    const userUpdateData: Record<string, any> = {}
    if (name) userUpdateData.name = sanitizeInput(name)
    if (email) userUpdateData.email = sanitizeEmail(email)
    if (phone !== undefined) userUpdateData.phone = phone ? sanitizeInput(phone) : null
    if (avatar !== undefined) userUpdateData.avatar = avatar ? sanitizeInput(avatar) : null

    // ── Build organization update data ──
    const orgUpdateData: Record<string, any> = {}
    if (platformName) orgUpdateData.name = sanitizeInput(platformName)
    if (platformId) orgUpdateData.code = platformId.trim().toUpperCase()
    if (accentColor) orgUpdateData.accentColor = accentColor
    if (status) {
      const validStatuses = ['active', 'inactive', 'trial']
      if (validStatuses.includes(status)) {
        orgUpdateData.status = status
      }
    }
    if (adminCommission !== undefined) {
      if (typeof adminCommission === 'number' && adminCommission >= 0 && adminCommission <= 100) {
        orgUpdateData.adminCommission = adminCommission
      }
    }
    if (gatewayCharge !== undefined) {
      if (typeof gatewayCharge === 'number' && gatewayCharge >= 0) {
        orgUpdateData.gatewayCharge = gatewayCharge
      }
    }
    if (razorpayAccountId !== undefined) {
      orgUpdateData.razorpayAccountId = razorpayAccountId || null
    }

    // ── Perform updates ──
    const updatedTeacher = await db.user.update({
      where: { id: teacherId },
      data: userUpdateData,
      include: { organization: true },
    })

    let updatedOrg = updatedTeacher.organization

    if (teacher.organizationId && Object.keys(orgUpdateData).length > 0) {
      updatedOrg = await db.organization.update({
        where: { id: teacher.organizationId },
        data: orgUpdateData,
      })
    }

    // ── Count students for the org ──
    let studentCount = 0
    if (teacher.organizationId) {
      studentCount = await db.student.count({
        where: { organizationId: teacher.organizationId },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Teacher updated successfully!',
      data: {
        teacher: {
          id: updatedTeacher.id,
          name: updatedTeacher.name,
          email: updatedTeacher.email,
          phone: updatedTeacher.phone,
          avatar: updatedTeacher.avatar,
          role: updatedTeacher.role,
          createdAt: updatedTeacher.createdAt,
        },
        platform: updatedOrg
          ? {
              id: updatedOrg.id,
              name: updatedOrg.name,
              code: updatedOrg.code,
              accentColor: updatedOrg.accentColor,
              status: updatedOrg.status,
              adminCommission: updatedOrg.adminCommission,
              gatewayCharge: updatedOrg.gatewayCharge,
              razorpayAccountId: updatedOrg.razorpayAccountId,
              createdAt: updatedOrg.createdAt,
            }
          : null,
        studentCount,
      },
    })
  } catch (error) {
    console.error('Edit teacher error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
