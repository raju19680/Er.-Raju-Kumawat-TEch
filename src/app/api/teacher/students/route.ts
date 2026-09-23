export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'
import { getDemoOrgId } from '@/lib/demo-org'
import { checkModuleAccess } from '@/lib/module-guard'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'settings')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || ''
    const skip = (page - 1) * limit

    const authUser = await getAuthUser(request)
    const orgId = await getDemoOrgId(request)

    const where: Record<string, unknown> = { organizationId: orgId }
    if (authUser?.role === 'teacher') {
      where.teacherId = authUser.id
    }

    if (search) {
      where.OR = [
        { name: { contains: search,  } },
        { email: { contains: search,  } },
        { phone: { contains: search } },
      ]
    }

    if (status === 'active') {
      where.isActive = true
      where.isBlocked = false
    } else if (status === 'blocked') {
      where.isBlocked = true
    }

    const [items, total] = await Promise.all([
      db.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { testAttempts: true },
          },
        },
      }),
      db.student.count({ where }),
    ])

    // Compute stats
    const baseStatWhere: Record<string, unknown> = { organizationId: orgId }
    if (authUser?.role === 'teacher') {
      baseStatWhere.teacherId = authUser.id
    }

    const [totalStat, activeStat, blockedStat, newThisMonthStat] = await Promise.all([
      db.student.count({ where: baseStatWhere }),
      db.student.count({ where: { ...baseStatWhere, isActive: true, isBlocked: false } }),
      db.student.count({ where: { ...baseStatWhere, isBlocked: true } }),
      db.student.count({
        where: {
          ...baseStatWhere,
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
    ])

    const mappedItems = items.map((item) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      avatar: item.avatar,
      isActive: item.isActive,
      isBlocked: item.isBlocked,
      blockedReason: item.blockedReason,
      blockedAt: item.blockedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      testAttemptCount: item._count.testAttempts,
    }))

    return NextResponse.json({
      success: true,
      items: mappedItems,
      total,
      page,
      limit,
      stats: {
        total: totalStat,
        active: activeStat,
        blocked: blockedStat,
        newThisMonth: newThisMonthStat,
      },
    })
  } catch (error) {
    console.error('Failed to fetch students:', error)
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action } = body

    if (!id || !action) {
      return NextResponse.json({ error: 'Student ID and action are required' }, { status: 400 })
    }

    const student = await db.student.findUnique({ where: { id } })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (action === 'block') {
      await db.student.update({
        where: { id },
        data: {
          isBlocked: true,
          blockedAt: new Date(),
          blockedReason: body.reason || 'Blocked by teacher',
        },
      })
      return NextResponse.json({ success: true, message: 'Student blocked successfully' })
    }

    if (action === 'unblock') {
      await db.student.update({
        where: { id },
        data: {
          isBlocked: false,
          blockedAt: null,
          blockedReason: null,
        },
      })
      return NextResponse.json({ success: true, message: 'Student unblocked successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Failed to update student:', error)
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    const student = await db.student.findUnique({ where: { id } })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Delete related records first
    await db.deviceSession.deleteMany({ where: { studentId: id } })
    await db.testAttempt.deleteMany({ where: { studentId: id } })
    await db.purchasedCourse.deleteMany({ where: { studentId: id } })
    await db.order.deleteMany({ where: { studentId: id } })
    await db.student.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Student deleted successfully' })
  } catch (error) {
    console.error('Failed to delete student:', error)
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 })
  }
}

