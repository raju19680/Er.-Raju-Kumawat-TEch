import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'
import { checkModuleAccess } from '@/lib/module-guard'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    // Require authentication — both admin and teacher can access
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || ''
    const organizationId = searchParams.get('organizationId') || ''
    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}

    // Resolve orgCode to orgId
    if (organizationId) {
      let resolvedOrgId = organizationId
      // If it looks like a short code (not a CUID), look up the org
      if (organizationId.length < 20) {
        const org = await db.organization.findUnique({
          where: { code: organizationId },
          select: { id: true },
        })
        if (org) {
          resolvedOrgId = org.id
        }
      }
      where.organizationId = resolvedOrgId
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
    } else if (status === 'inactive') {
      where.isActive = false
      where.isBlocked = false
    } else if (status === 'blocked') {
      where.isBlocked = true
    }

    // Fetch students with device count
    const [items, total] = await Promise.all([
      db.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              deviceSessions: {
                where: { isActive: true },
              },
            },
          },
        },
      }),
      db.student.count({ where }),
    ])

    // Compute stats (within the same org scope)
    const statsWhere: Prisma.StudentWhereInput = organizationId ? { organizationId } : {}

    const [totalStat, activeStat, inactiveStat, blockedStat, newThisMonthStat] = await Promise.all([
      db.student.count({ where: statsWhere }),
      db.student.count({ where: { ...statsWhere, isActive: true, isBlocked: false } }),
      db.student.count({ where: { ...statsWhere, isActive: false, isBlocked: false } }),
      db.student.count({ where: { ...statsWhere, isBlocked: true } }),
      db.student.count({
        where: {
          ...statsWhere,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ])

    // Map items to include deviceCount
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
      organizationId: item.organizationId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      deviceCount: item._count.deviceSessions,
    }))

    return NextResponse.json({
      items: mappedItems,
      total,
      page,
      limit,
      stats: {
        total: totalStat,
        active: activeStat,
        inactive: inactiveStat,
        blocked: blockedStat,
        newThisMonth: newThisMonthStat,
      },
    })
  } catch (error) {
    console.error('Failed to fetch students:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check module access for teachers (students are part of dashboard - always accessible)
    const accessCheck = await checkModuleAccess(request, 'dashboard')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const body = await request.json()

    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    if (!body.organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Resolve orgCode to orgId
    let orgId = body.organizationId
    if (body.organizationId.length < 20) {
      const org = await db.organization.findUnique({
        where: { code: body.organizationId },
        select: { id: true },
      })
      orgId = org?.id || body.organizationId
    }

    // Check for duplicate email
    const existing = await db.student.findFirst({
      where: { email: body.email },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A student with this email already exists' },
        { status: 400 }
      )
    }

    const student = await db.student.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        avatar: body.avatar || null,
        isActive: body.isActive ?? true,
        organizationId: orgId,
      },
    })

    return NextResponse.json(student, { status: 201 })
  } catch (error) {
    console.error('Failed to create student:', error)
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    )
  }
}
