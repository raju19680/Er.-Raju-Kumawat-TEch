import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const student = await db.student.findUnique({
      where: { id },
      include: {
        organization: {
          select: { id: true, name: true, code: true, accentColor: true },
        },
        deviceSessions: {
          orderBy: { lastActive: 'desc' },
        },
        purchasedCourses: {
          include: {
            course: {
              select: { id: true, title: true, thumbnail: true, price: true },
            },
          },
          orderBy: { purchasedAt: 'desc' },
        },
        testAttempts: {
          select: {
            id: true,
            score: true,
            totalMarks: true,
            status: true,
            startedAt: true,
            completedAt: true,
            test: {
              select: { id: true, title: true },
            },
          },
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            testAttempts: true,
            orders: true,
            purchasedCourses: true,
          },
        },
      },
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Compute test summary
    const testAgg = await db.testAttempt.aggregate({
      where: { studentId: id, status: 'completed' },
      _count: true,
      _avg: { score: true },
    })

    // Compute order summary
    const orderAgg = await db.order.aggregate({
      where: { studentId: id, status: 'completed' },
      _count: true,
      _sum: { finalAmount: true },
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
        organizationId: student.organizationId,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        organization: student.organization,
        deviceSessions: student.deviceSessions.map((ds) => ({
          id: ds.id,
          deviceId: ds.deviceId,
          deviceName: ds.deviceName,
          deviceType: ds.deviceType,
          browser: ds.browser,
          os: ds.os,
          ipAddress: ds.ipAddress,
          location: ds.location,
          lastActive: ds.lastActive,
          isActive: ds.isActive,
          loginAt: ds.loginAt,
          logoutAt: ds.logoutAt,
          userAgent: ds.userAgent,
        })),
        purchasedCourses: student.purchasedCourses.map((pc) => ({
          id: pc.id,
          purchasedAt: pc.purchasedAt,
          expiresAt: pc.expiresAt,
          course: pc.course,
        })),
        testAttempts: student.testAttempts,
        testSummary: {
          totalAttempts: student._count.testAttempts,
          completedAttempts: testAgg._count,
          avgScore: Math.round((testAgg._avg.score || 0) * 10) / 10,
        },
        orderSummary: {
          totalOrders: student._count.orders,
          completedOrders: orderAgg._count,
          totalSpent: Math.round((orderAgg._sum.finalAmount || 0) * 100) / 100,
        },
        purchasedCoursesCount: student._count.purchasedCourses,
      },
    })
  } catch (error) {
    console.error('Failed to fetch student:', error)
    return NextResponse.json(
      { error: 'Failed to fetch student' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'dashboard')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Verify student exists
    const existing = await db.student.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Check for duplicate email (exclude current record)
    if (body.email !== undefined) {
      const duplicate = await db.student.findFirst({
        where: {
          email: body.email,
          id: { not: id },
        },
      })
      if (duplicate) {
        return NextResponse.json(
          { error: 'A student with this email already exists' },
          { status: 409 }
        )
      }
    }

    // Resolve orgCode to orgId if organizationId is provided
    let orgId = existing.organizationId
    if (body.organizationId) {
      if (body.organizationId.length < 20) {
        const org = await db.organization.findUnique({
          where: { code: body.organizationId },
          select: { id: true },
        })
        orgId = org?.id || body.organizationId
      } else {
        orgId = body.organizationId
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone || null
    if (body.avatar !== undefined) updateData.avatar = body.avatar || null
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.organizationId) updateData.organizationId = orgId

    // Block/Unblock support
    if (body.isBlocked !== undefined) {
      updateData.isBlocked = body.isBlocked
      if (body.isBlocked) {
        updateData.blockedReason = body.blockedReason || null
        updateData.blockedAt = new Date()
      } else {
        updateData.blockedReason = null
        updateData.blockedAt = null
      }
    }

    const student = await db.student.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, student })
  } catch (error) {
    console.error('Failed to update student:', error)
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'dashboard')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params

    // Verify student exists
    const existing = await db.student.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    await db.student.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Student deleted' })
  } catch (error) {
    console.error('Failed to delete student:', error)
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    )
  }
}
