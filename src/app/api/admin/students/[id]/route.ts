import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'
import { sanitizeEmail, sanitizeInput } from '@/lib/auth-security'

/**
 * GET /api/admin/students/[id]
 * Get a single student's full details.
 * Only accessible by platform_admin.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ── Auth check: Must be platform_admin ──
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const { id } = await params

    // ── Fetch student with organization ──
    const student = await db.student.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
            accentColor: true,
            phone: true,
            status: true,
          },
        },
        deviceSessions: {
          orderBy: { lastActive: 'desc' },
        },
      },
    })

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found.' },
        { status: 404 }
      )
    }

    // ── Get teacher info for the student's org ──
    const teacher = await db.user.findFirst({
      where: {
        role: 'teacher',
        organizationId: student.organizationId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
      },
    })

    // ── Test attempt summary ──
    const [testAttemptAgg, completedTestAgg] = await Promise.all([
      db.testAttempt.aggregate({
        where: { studentId: id },
        _count: true,
        _avg: { score: true },
      }),
      db.testAttempt.count({
        where: { studentId: id, status: 'completed' },
      }),
    ])

    // ── Order summary ──
    const [orderAgg, completedOrderAgg] = await Promise.all([
      db.order.aggregate({
        where: { studentId: id },
        _count: true,
        _sum: { finalAmount: true },
      }),
      db.order.count({
        where: { studentId: id, status: 'completed' },
      }),
    ])

    // ── Purchased courses count ──
    const purchasedCoursesCount = await db.purchasedCourse.count({
      where: { studentId: id },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        avatar: student.avatar,
        isActive: student.isActive,
        isBlocked: student.isBlocked,
        blockedReason: student.blockedReason,
        blockedAt: student.blockedAt,
        userId: student.userId,
        organizationId: student.organizationId,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        organization: student.organization,
        teacher,
        deviceSessions: student.deviceSessions,
        testSummary: {
          totalAttempts: testAttemptAgg._count,
          completedAttempts: completedTestAgg,
          avgScore: Math.round(testAttemptAgg._avg.score ?? 0),
        },
        orderSummary: {
          totalOrders: orderAgg._count,
          completedOrders: completedOrderAgg,
          totalSpent: orderAgg._sum.finalAmount ?? 0,
        },
        purchasedCoursesCount,
      },
    })
  } catch (error) {
    console.error('Get student detail error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/students/[id]
 * Update a student.
 * Only accessible by platform_admin.
 *
 * Updatable fields: name, email, phone, isActive, isBlocked, blockedReason
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ── Auth check: Must be platform_admin ──
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const { id } = await params
    const body = await req.json()
    const { name, email, phone, isActive, isBlocked, blockedReason } = body

    // ── Find the student ──
    const student = await db.student.findUnique({
      where: { id },
    })

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found.' },
        { status: 404 }
      )
    }

    // ── Check email uniqueness if changing ──
    if (email && email !== student.email) {
      const sanitizedEmail = sanitizeEmail(email)

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(sanitizedEmail)) {
        return NextResponse.json(
          { success: false, message: 'Invalid email format.' },
          { status: 400 }
        )
      }

      const existingStudent = await db.student.findFirst({
        where: {
          email: sanitizedEmail,
          id: { not: id },
        },
      })

      if (existingStudent) {
        return NextResponse.json(
          { success: false, message: 'A student with this email already exists.' },
          { status: 409 }
        )
      }
    }

    // ── Build update data ──
    const updateData: Prisma.StudentUpdateInput = {}
    if (name) updateData.name = sanitizeInput(name)
    if (email && email !== student.email) updateData.email = sanitizeEmail(email)
    if (phone !== undefined) updateData.phone = phone ? sanitizeInput(phone) : null
    if (isActive !== undefined) updateData.isActive = isActive

    // ── Handle blocking/unblocking ──
    if (isBlocked !== undefined) {
      if (isBlocked === true) {
        // Blocking the student
        updateData.isBlocked = true
        updateData.blockedReason = blockedReason ? sanitizeInput(blockedReason) : null
        updateData.blockedAt = new Date()
      } else {
        // Unblocking the student
        updateData.isBlocked = false
        updateData.blockedReason = null
        updateData.blockedAt = null
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No fields to update.' },
        { status: 400 }
      )
    }

    // ── Update the student ──
    const updatedStudent = await db.student.update({
      where: { id },
      data: updateData,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
            accentColor: true,
          },
        },
      },
    })

    // Get teacher info for the org
    const teacher = await db.user.findFirst({
      where: {
        role: 'teacher',
        organizationId: updatedStudent.organizationId,
      },
      select: { id: true, name: true },
    })

    // ── Audit log ──
    console.log(`[AUDIT] Student updated: id=${id}, admin=${authResult.user.email}, fields=${Object.keys(updateData).join(',')}`)

    return NextResponse.json({
      success: true,
      message: 'Student updated successfully!',
      data: {
        id: updatedStudent.id,
        name: updatedStudent.name,
        email: updatedStudent.email,
        phone: updatedStudent.phone,
        avatar: updatedStudent.avatar,
        isActive: updatedStudent.isActive,
        isBlocked: updatedStudent.isBlocked,
        blockedReason: updatedStudent.blockedReason,
        blockedAt: updatedStudent.blockedAt,
        organization: updatedStudent.organization,
        teacher: teacher ? { id: teacher.id, name: teacher.name } : null,
        createdAt: updatedStudent.createdAt,
        updatedAt: updatedStudent.updatedAt,
      },
    })
  } catch (error) {
    console.error('Update student error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/students/[id]
 * Delete a student and their test attempts, orders, payments, device sessions.
 * Only accessible by platform_admin.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ── Auth check: Must be platform_admin ──
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const { id } = await params

    // ── Find the student ──
    const student = await db.student.findUnique({
      where: { id },
    })

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found.' },
        { status: 404 }
      )
    }

    const studentName = student.name
    const studentEmail = student.email

    // ── Delete everything in a transaction ──
    await db.$transaction(async (tx) => {
      // 1. Get all order IDs for this student
      const orders = await tx.order.findMany({
        where: { studentId: id },
        select: { id: true },
      })
      const orderIds = orders.map((o) => o.id)

      // 2. Delete payments linked to these orders
      if (orderIds.length > 0) {
        await tx.payment.deleteMany({
          where: { orderId: { in: orderIds } },
        })
      }

      // 3. Delete test attempts for this student
      await tx.testAttempt.deleteMany({
        where: { studentId: id },
      })

      // 4. Delete orders for this student
      await tx.order.deleteMany({
        where: { studentId: id },
      })

      // 5. Delete purchased courses for this student
      await tx.purchasedCourse.deleteMany({
        where: { studentId: id },
      })

      // 6. Delete device sessions for this student
      await tx.deviceSession.deleteMany({
        where: { studentId: id },
      })

      // 7. Delete the student
      await tx.student.delete({
        where: { id },
      })
    })

    // ── Audit log ──
    console.log(`[AUDIT] Student deleted: id=${id}, name=${studentName}, admin=${authResult.user.email}`)

    return NextResponse.json({
      success: true,
      message: `Student "${studentName}" has been deleted successfully.`,
      data: {
        deletedStudent: {
          id,
          name: studentName,
          email: studentEmail,
        },
      },
    })
  } catch (error) {
    console.error('Delete student error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
