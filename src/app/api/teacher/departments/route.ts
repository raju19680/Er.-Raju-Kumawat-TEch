export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'
import { resolveOrgId } from '@/lib/demo-org'

// Using imported resolveOrgId from demo-org

export async function GET(req: NextRequest) {
  try {
    const access = await checkModuleAccess(req, 'settings')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || ''
    const skip = (page - 1) * limit

    const orgId = await resolveOrgId(req, searchParams.get('organizationId') || undefined)

    const where: Record<string, unknown> = { organizationId: orgId }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { description: { contains: search } },
        { headName: { contains: search } },
      ]
    }
    if (status) {
      where.status = status
    }

    const [items, total, totalActive, totalInactive, totalStudents] = await Promise.all([
      db.department.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          _count: { select: { students: true } },
        },
      }),
      db.department.count({ where: { organizationId: orgId } }),
      db.department.count({ where: { organizationId: orgId, status: 'active' } }),
      db.department.count({ where: { organizationId: orgId, status: 'inactive' } }),
      db.student.count({ where: { organizationId: orgId, departmentId: { not: null } } }),
    ])

    const formatted = items.map((item) => ({
      ...item,
      studentCount: item._count.students,
    }))

    const stats = {
      total,
      active: totalActive,
      inactive: totalInactive,
      totalStudents,
    }

    return NextResponse.json({ success: true, items: formatted, total, stats })
  } catch (error) {
    console.error('Failed to fetch departments:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch departments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const access = await checkModuleAccess(req, 'settings')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await req.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
    }
    if (!body.code) {
      return NextResponse.json({ success: false, error: 'Code is required' }, { status: 400 })
    }
    if (!body.organizationId) {
      return NextResponse.json({ success: false, error: 'Organization ID is required' }, { status: 400 })
    }

    const orgId = await resolveOrgId(req, body.organizationId)

    // Check unique code per org
    const existing = await db.department.findUnique({
      where: {
        code_organizationId: {
          code: body.code,
          organizationId: orgId,
        },
      },
    })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A department with this code already exists in this organization' },
        { status: 409 }
      )
    }

    const department = await db.department.create({
      data: {
        name: body.name,
        code: body.code,
        description: body.description || null,
        headName: body.headName || null,
        headEmail: body.headEmail || null,
        headPhone: body.headPhone || null,
        icon: body.icon || null,
        color: body.color || null,
        status: body.status || 'active',
        sortOrder: body.sortOrder ?? 0,
        organizationId: orgId,
      },
    })

    return NextResponse.json({ success: true, department }, { status: 201 })
  } catch (error) {
    console.error('Failed to create department:', error)
    return NextResponse.json({ success: false, error: 'Failed to create department' }, { status: 500 })
  }
}

