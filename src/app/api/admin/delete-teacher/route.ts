export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'

/**
 * Delete a teacher and their entire organization (platform) with all associated data.
 * Only accessible by platform_admin.
 * Prevents deletion of the super admin's own org (code: 9680177120).
 */
export async function DELETE(req: NextRequest) {
  try {
    // ── Auth check: Must be platform_admin ──
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const { teacherId } = await req.json()

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

    const allowedRoles = ['teacher', 'org_admin', 'admin', 'ADMIN', 'platform_admin']
    if (!teacher || !allowedRoles.includes(teacher.role)) {
      return NextResponse.json(
        { success: false, message: 'Teacher not found or user is not a teacher.' },
        { status: 404 }
      )
    }

    if (!teacher.organizationId || !teacher.organization) {
      return NextResponse.json(
        { success: false, message: 'Teacher has no associated organization.' },
        { status: 400 }
      )
    }

    // ── Prevent deletion of the super admin's own org ──
    const SUPER_ADMIN_ORG_CODE = '9680177120'
    if (teacher.organization.code === SUPER_ADMIN_ORG_CODE) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete the super admin organization.' },
        { status: 403 }
      )
    }

    const orgId = teacher.organizationId
    const teacherEmail = teacher.email
    const teacherName = teacher.name

    // ── Delete everything in a transaction ──
    await db.$transaction(async (tx) => {
      // 1. Get all test series IDs for this org
      const testSeries = await tx.testSeries.findMany({
        where: { organizationId: orgId },
        select: { id: true },
      })
      const testSeriesIds = testSeries.map((ts) => ts.id)

      // 2. Get all test IDs for these test series
      const tests = await tx.test.findMany({
        where: { organizationId: orgId },
        select: { id: true },
      })
      const testIds = tests.map((t) => t.id)

      // 3. Get all question IDs for these tests
      const questions = await tx.question.findMany({
        where: { testId: { in: testIds } },
        select: { id: true },
      })
      const questionIds = questions.map((q) => q.id)

      // 4. Get all student IDs for this org
      const students = await tx.student.findMany({
        where: { organizationId: orgId },
        select: { id: true },
      })
      const studentIds = students.map((s) => s.id)

      // 5. Get all order IDs for this org
      const orders = await tx.order.findMany({
        where: { organizationId: orgId },
        select: { id: true },
      })
      const orderIds = orders.map((o) => o.id)

      // ── Delete in dependency order ──

      // Delete reported questions (depends on questions)
      if (questionIds.length > 0) {
        await tx.reportedQuestion.deleteMany({
          where: { questionId: { in: questionIds } },
        })
      }

      // Delete test attempts (depends on tests and students)
      await tx.testAttempt.deleteMany({
        where: { testId: { in: testIds } },
      })
      if (studentIds.length > 0) {
        await tx.testAttempt.deleteMany({
          where: { studentId: { in: studentIds } },
        })
      }

      // Delete questions (depends on tests)
      await tx.question.deleteMany({
        where: { testId: { in: testIds } },
      })

      // Delete tests (depends on test series and organization)
      await tx.test.deleteMany({
        where: { organizationId: orgId },
      })

      // Delete test series (depends on organization)
      await tx.testSeries.deleteMany({
        where: { organizationId: orgId },
      })

      // Delete payments (depends on orders)
      if (orderIds.length > 0) {
        await tx.payment.deleteMany({
          where: { orderId: { in: orderIds } },
        })
      }
      // Also delete any payments directly linked to org
      await tx.payment.deleteMany({
        where: { organizationId: orgId },
      })

      // Delete orders (depends on students and organization)
      await tx.order.deleteMany({
        where: { organizationId: orgId },
      })

      // Delete students (depends on organization)
      await tx.student.deleteMany({
        where: { organizationId: orgId },
      })

      // Delete courses
      await tx.course.deleteMany({
        where: { organizationId: orgId },
      })

      // Delete blogs
      await tx.blog.deleteMany({
        where: { organizationId: orgId },
      })

      // Delete quick links
      await tx.quickLink.deleteMany({
        where: { organizationId: orgId },
      })

      // Delete banners
      await tx.banner.deleteMany({
        where: { organizationId: orgId },
      })

      // Delete coupons
      await tx.coupon.deleteMany({
        where: { organizationId: orgId },
      })

      // Delete categories
      await tx.category.deleteMany({
        where: { organizationId: orgId },
      })

      // Delete notifications
      await tx.notification.deleteMany({
        where: { organizationId: orgId },
      })

      // Delete leads
      await tx.lead.deleteMany({
        where: { organizationId: orgId },
      })

      // Delete support queries
      await tx.supportQuery.deleteMany({
        where: { organizationId: orgId },
      })

      // Delete login attempts for this teacher
      await tx.loginAttempt.deleteMany({
        where: { email: teacherEmail },
      })

      // Delete the teacher (user)
      await tx.user.delete({
        where: { id: teacherId },
      })

      // Delete the organization
      await tx.organization.delete({
        where: { id: orgId },
      })

      // Suppress unused variable warning
      void testSeriesIds
      void studentIds
    })

    return NextResponse.json({
      success: true,
      message: `Teacher "${teacherName}" and their organization have been deleted successfully.`,
      data: {
        deletedTeacher: {
          id: teacherId,
          name: teacherName,
          email: teacherEmail,
        },
      },
    })
  } catch (error) {
    console.error('Delete teacher error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

