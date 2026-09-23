export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'

/**
 * Organizations API — CRUD for organizations.
 * Only accessible by platform_admin.
 */

// ── GET: List all organizations ──
export async function GET(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    // Exclude PLATFORM org (super admin's own org)
    const platformOrg = await db.organization.findFirst({
      where: { code: '9680177120' },
    })
    const platformOrgId = platformOrg?.id

    const organizations = await db.organization.findMany({
      where: {}, // platformOrgId ? { id: { not: platformOrgId } } : {} removed
      orderBy: { createdAt: 'desc' },
    })

    const orgIds = organizations.map((org) => org.id)

    const teacherCounts = await db.user.groupBy({
      by: ['organizationId'],
      where: { organizationId: { in: orgIds }, role: { in: ['teacher', 'org_admin', 'admin', 'ADMIN', 'platform_admin'] } },
      _count: { id: true },
    })
    const teacherCountMap = new Map<string, number>()
    for (const tc of teacherCounts) {
      teacherCountMap.set(tc.organizationId!, tc._count.id)
    }

    const studentCounts = await db.student.groupBy({
      by: ['organizationId'],
      where: { organizationId: { in: orgIds } },
      _count: { id: true },
    })
    const studentCountMap = new Map<string, number>()
    for (const sc of studentCounts) {
      studentCountMap.set(sc.organizationId, sc._count.id)
    }

    const formattedOrganizations = organizations.map((org) => ({
      id: org.id,
      name: org.name,
      code: org.code,
      phone: org.phone,
      accentColor: org.accentColor,
      status: org.status,
      adminCommission: org.adminCommission,
      gatewayCharge: org.gatewayCharge,
      razorpayKeyId: org.razorpayKeyId,
      razorpayKeySecret: org.razorpayKeySecret,
      razorpayAccountId: org.razorpayAccountId,
      teacherCount: teacherCountMap.get(org.id) || 0,
      studentCount: studentCountMap.get(org.id) || 0,
      createdAt: org.createdAt.toISOString(),
    }))

    return NextResponse.json({ success: true, organizations: formattedOrganizations })
  } catch (error) {
    console.error('Fetch organizations error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

// ── POST: Create a new organization ──
export async function POST(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await req.json()
    const {
      name, code, phone, accentColor, status,
      adminCommission, gatewayCharge,
      razorpayKeyId, razorpayKeySecret, razorpayAccountId,
    } = body

    if (!name || !code) {
      return NextResponse.json(
        { success: false, message: 'Organization name and code are required.' },
        { status: 400 }
      )
    }

    // Check for existing org with same code
    const existingOrg = await db.organization.findUnique({ where: { code: code.trim().toUpperCase() } })
    if (existingOrg) {
      return NextResponse.json(
        { success: false, message: 'An organization with this code already exists.' },
        { status: 409 }
      )
    }

    const validStatuses = ['active', 'inactive', 'trial']
    const statusValue = status && validStatuses.includes(status) ? status : 'trial'

    const organization = await db.organization.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        phone: phone?.trim() || null,
        accentColor: accentColor || '#d97706',
        status: statusValue,
        adminCommission: typeof adminCommission === 'number' ? adminCommission : 20,
        gatewayCharge: typeof gatewayCharge === 'number' ? gatewayCharge : 2.36,
        razorpayKeyId: razorpayKeyId?.trim() || null,
        razorpayKeySecret: razorpayKeySecret?.trim() || null,
        razorpayAccountId: razorpayAccountId?.trim() || null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Organization created successfully!',
      organization: {
        id: organization.id,
        name: organization.name,
        code: organization.code,
        status: organization.status,
      },
    })
  } catch (error) {
    console.error('Create organization error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

// ── PUT: Update an organization ──
export async function PUT(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await req.json()
    const {
      organizationId, name, code, phone, accentColor, status,
      adminCommission, gatewayCharge,
      razorpayKeyId, razorpayKeySecret, razorpayAccountId,
    } = body

    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: 'Organization ID is required.' },
        { status: 400 }
      )
    }

    const existingOrg = await db.organization.findUnique({ where: { id: organizationId } })
    if (!existingOrg) {
      return NextResponse.json(
        { success: false, message: 'Organization not found.' },
        { status: 404 }
      )
    }

    // Prevent modifying the super admin org
    if (existingOrg.code === '9680177120') {
      return NextResponse.json(
        { success: false, message: 'Cannot modify the super admin organization.' },
        { status: 403 }
      )
    }

    // If code is being changed, check for conflicts
    if (code && code.trim().toUpperCase() !== existingOrg.code) {
      const conflictOrg = await db.organization.findUnique({ where: { code: code.trim().toUpperCase() } })
      if (conflictOrg) {
        return NextResponse.json(
          { success: false, message: 'An organization with this code already exists.' },
          { status: 409 }
        )
      }
    }

    const validStatuses = ['active', 'inactive', 'trial']
    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (code !== undefined) updateData.code = code.trim().toUpperCase()
    if (phone !== undefined) updateData.phone = phone?.trim() || null
    if (accentColor !== undefined) updateData.accentColor = accentColor
    if (status !== undefined && validStatuses.includes(status)) updateData.status = status
    if (adminCommission !== undefined) updateData.adminCommission = adminCommission
    if (gatewayCharge !== undefined) updateData.gatewayCharge = gatewayCharge
    if (razorpayKeyId !== undefined) updateData.razorpayKeyId = razorpayKeyId?.trim() || null
    if (razorpayKeySecret !== undefined) updateData.razorpayKeySecret = razorpayKeySecret?.trim() || null
    if (razorpayAccountId !== undefined) updateData.razorpayAccountId = razorpayAccountId?.trim() || null

    const organization = await db.organization.update({
      where: { id: organizationId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'Organization updated successfully!',
      organization: {
        id: organization.id,
        name: organization.name,
        code: organization.code,
        status: organization.status,
      },
    })
  } catch (error) {
    console.error('Update organization error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

// ── DELETE: Delete an organization and all associated data ──
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const { organizationId } = await req.json()

    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: 'Organization ID is required.' },
        { status: 400 }
      )
    }

    const organization = await db.organization.findUnique({
      where: { id: organizationId },
    })

    if (!organization) {
      return NextResponse.json(
        { success: false, message: 'Organization not found.' },
        { status: 404 }
      )
    }

    // Prevent deleting the super admin org
    if (organization.code === '9680177120') {
      return NextResponse.json(
        { success: false, message: 'Cannot delete the super admin organization.' },
        { status: 403 }
      )
    }

    const orgId = organizationId
    const orgName = organization.name

    // Delete everything in a transaction
    await db.$transaction(async (tx) => {
      const tests = await tx.test.findMany({ where: { organizationId: orgId }, select: { id: true } })
      const testIds = tests.map((t) => t.id)

      const questions = await tx.question.findMany({ where: { testId: { in: testIds } }, select: { id: true } })
      const questionIds = questions.map((q) => q.id)

      const students = await tx.student.findMany({ where: { organizationId: orgId }, select: { id: true } })
      const studentIds = students.map((s) => s.id)

      const orders = await tx.order.findMany({ where: { organizationId: orgId }, select: { id: true } })
      const orderIds = orders.map((o) => o.id)

      if (questionIds.length > 0) {
        await tx.reportedQuestion.deleteMany({ where: { questionId: { in: questionIds } } })
      }

      await tx.testAttempt.deleteMany({ where: { testId: { in: testIds } } })
      if (studentIds.length > 0) {
        await tx.testAttempt.deleteMany({ where: { studentId: { in: studentIds } } })
      }

      await tx.question.deleteMany({ where: { testId: { in: testIds } } })
      await tx.test.deleteMany({ where: { organizationId: orgId } })
      await tx.testSeries.deleteMany({ where: { organizationId: orgId } })

      if (orderIds.length > 0) {
        await tx.payment.deleteMany({ where: { orderId: { in: orderIds } } })
      }
      await tx.payment.deleteMany({ where: { organizationId: orgId } })
      await tx.order.deleteMany({ where: { organizationId: orgId } })
      await tx.student.deleteMany({ where: { organizationId: orgId } })
      await tx.course.deleteMany({ where: { organizationId: orgId } })
      await tx.blog.deleteMany({ where: { organizationId: orgId } })
      await tx.quickLink.deleteMany({ where: { organizationId: orgId } })
      await tx.banner.deleteMany({ where: { organizationId: orgId } })
      await tx.coupon.deleteMany({ where: { organizationId: orgId } })
      await tx.category.deleteMany({ where: { organizationId: orgId } })
      await tx.notification.deleteMany({ where: { organizationId: orgId } })
      await tx.lead.deleteMany({ where: { organizationId: orgId } })
      await tx.supportQuery.deleteMany({ where: { organizationId: orgId } })

      // Delete teachers linked to this org
      const teachers = await tx.user.findMany({ where: { organizationId: orgId }, select: { id: true, email: true } })
      if (teachers.length > 0) {
        for (const t of teachers) {
          await tx.loginAttempt.deleteMany({ where: { email: t.email } })
        }
        await tx.user.deleteMany({ where: { organizationId: orgId } })
      }

      // Delete module access for teachers of this org
      if (teachers.length > 0) {
        const teacherIds = teachers.map((t) => t.id)
        await tx.teacherModuleAccess.deleteMany({ where: { teacherId: { in: teacherIds } } })
      }

      await tx.organization.delete({ where: { id: orgId } })
    })

    return NextResponse.json({
      success: true,
      message: `Organization "${orgName}" and all associated data have been deleted successfully.`,
    })
  } catch (error) {
    console.error('Delete organization error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

// ── PATCH: Send email to organization ──
export async function PATCH(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await req.json()
    const { action, organizationId, subject, body: emailBody } = body

    if (action === 'send_email') {
      if (!organizationId || !subject || !emailBody) {
        return NextResponse.json(
          { success: false, message: 'Organization ID, subject, and body are required.' },
          { status: 400 }
        )
      }

      // Find teacher users for this org to get their emails
      const orgUsers = await db.user.findMany({
        where: { organizationId, role: 'teacher' },
        select: { email: true, name: true },
      })

      if (orgUsers.length === 0) {
        return NextResponse.json(
          { success: false, message: 'No teacher accounts found for this organization.' },
          { status: 404 }
        )
      }

      // Log emails for each teacher
      const emailLogs = await Promise.all(
        orgUsers.map((user) =>
          db.emailLog.create({
            data: {
              to: user.email,
              subject,
              body: emailBody,
              type: 'notification',
              status: 'sent',
              organizationId,
              sentAt: new Date(),
            },
          })
        )
      )

      return NextResponse.json({
        success: true,
        message: `Email sent to ${emailLogs.length} teacher(s) in the organization.`,
        sentCount: emailLogs.length,
      })
    }

    return NextResponse.json(
      { success: false, message: 'Unknown action.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[Organizations PATCH] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    )
  }
}
