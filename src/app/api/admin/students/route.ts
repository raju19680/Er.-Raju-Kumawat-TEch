export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { requireAdminOrTeacher } from '@/lib/auth-helpers'
import { sanitizeEmail, sanitizeInput } from '@/lib/auth-security'

/**
 * GET /api/admin/students
 * Fetch students across the platform with their organization/teacher info.
 * Accessible by platform_admin (Super Admin) and teachers.
 *
 * Query params:
 *   search         — filter by name, email, or phone (partial match)
 *   status         — "active" or "inactive"
 *   teacherId      — filter by teacher's organization
 *   organizationId — filter by organization directly
 */
export async function GET(req: NextRequest) {
  try {
    // ── Auth check ──
    const authResult = await requireAdminOrTeacher(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const auth = authResult.user
    const isSuperAdmin = auth.role === 'platform_admin'

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim() || ''
    const status = searchParams.get('status')?.trim() || ''
    const teacherId = searchParams.get('teacherId')?.trim() || ''
    const organizationId = searchParams.get('organizationId')?.trim() || ''

    const page = Math.max(1, parseInt(searchParams.get('page')?.trim() || '1'))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize')?.trim() || '20')))
    const skip = (page - 1) * pageSize

    // ── Build where clause ──
    const where: Prisma.StudentWhereInput = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
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

    // Role-based organization scoping
    if (isSuperAdmin) {
      if (organizationId) {
        where.organizationId = organizationId
      }
      if (teacherId) {
        const teacher = await db.user.findUnique({
          where: { id: teacherId },
          select: { id: true, role: true, organizationId: true },
        })
        if (teacher && teacher.role === 'teacher' && teacher.organizationId) {
          where.organizationId = teacher.organizationId
        } else {
          return NextResponse.json({
            success: true,
            students: [],
            stats: { total: 0, active: 0, inactive: 0, newThisMonth: 0, blocked: 0 },
            teachers: [],
            pagination: { page, pageSize, totalItems: 0, totalPages: 0 },
          })
        }
      }
    } else {
      // Teacher or Org Admin
      if (auth.orgId) {
        where.organizationId = auth.orgId
      }
    }

    // ── Fetch students with organization (paginated) ──
    const [students, totalItems] = await Promise.all([
      db.student.findMany({
        where,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              code: true,
              accentColor: true,
            },
          },
          _count: {
            select: {
              deviceSessions: {
                where: { isActive: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      db.student.count({ where }),
    ])

    // ── Get teacher info for each organization ──
    const orgIds = [...new Set(students.map((s) => s.organizationId))]

    const teachers = await db.user.findMany({
      where: {
        role: 'teacher',
        organizationId: { in: orgIds },
      },
      select: {
        id: true,
        name: true,
        organizationId: true,
        organization: {
          select: { id: true, name: true },
        },
      },
    })

    // Build orgId -> teacher map
    const orgTeacherMap = new Map<string, { id: string; name: string }>()
    for (const t of teachers) {
      if (t.organizationId) {
        orgTeacherMap.set(t.organizationId, { id: t.id, name: t.name })
      }
    }

    // ── Format students ──
    const formattedStudents = students.map((student) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      avatar: student.avatar,
      isActive: student.isActive,
      isBlocked: student.isBlocked,
      blockedReason: student.blockedReason,
      blockedAt: student.blockedAt,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
      organization: student.organization
        ? {
            id: student.organization.id,
            name: student.organization.name,
            code: student.organization.code,
            accentColor: student.organization.accentColor,
          }
        : null,
      teacher: orgTeacherMap.get(student.organizationId) || null,
      deviceCount: student._count.deviceSessions,
    }))

    // ── Compute stats (unfiltered for overall counts) ──
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [total, active, inactive, newThisMonth, blocked] = await Promise.all([
      db.student.count(),
      db.student.count({ where: { isActive: true } }),
      db.student.count({ where: { isActive: false } }),
      db.student.count({ where: { createdAt: { gte: startOfMonth } } }),
      db.student.count({ where: { isBlocked: true } }),
    ])

    // ── Fetch all teachers (for filter dropdown) ──
    const allTeachers = await db.user.findMany({
      where: { role: 'teacher' },
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    // ── Get student count per organization for teacher filter buttons ──
    const studentCountByOrg = await db.student.groupBy({
      by: ['organizationId'],
      _count: { id: true },
    })
    const studentCountMap = new Map(studentCountByOrg.map(item => [item.organizationId, item._count.id]))

    const teacherList = allTeachers.map((t) => ({
      id: t.id,
      name: t.name,
      organization: t.organization
        ? { id: t.organization.id, name: t.organization.name }
        : null,
      studentCount: t.organizationId ? (studentCountMap.get(t.organizationId) || 0) : 0,
    }))

    const totalPages = Math.ceil(totalItems / pageSize)

    return NextResponse.json({
      success: true,
      students: formattedStudents,
      stats: { total, active, inactive, newThisMonth, blocked },
      teachers: teacherList,
      pagination: { page, pageSize, totalItems, totalPages },
    })
  } catch (error) {
    console.error('Fetch students error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/students
 * Create a new student.
 * Only accessible by platform_admin.
 *
 * Required: name, email, organizationId
 * Optional: phone, avatar, isActive, isBlocked, blockedReason
 */
export async function POST(req: NextRequest) {
  try {
    // ── Auth check ──
    const authResult = await requireAdminOrTeacher(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const auth = authResult.user
    const isSuperAdmin = auth.role === 'platform_admin'

    const body = await req.json()
    const {
      name,
      email,
      organizationId: inputOrgId,
      phone,
      avatar,
      isActive,
      isBlocked,
      blockedReason,
    } = body

    const organizationId = isSuperAdmin ? (inputOrgId || auth.orgId) : auth.orgId

    // ── Input validation ──
    if (!name || !email || !organizationId) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and organizationId are required.' },
        { status: 400 }
      )
    }

    const sanitizedName = sanitizeInput(name)
    const sanitizedEmail = sanitizeEmail(email)
    const sanitizedPhone = phone ? sanitizeInput(phone) : null

    // ── Validate email format ──
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format.' },
        { status: 400 }
      )
    }

    // ── Check for duplicate email ──
    const existingStudent = await db.student.findFirst({
      where: { email: sanitizedEmail },
    })

    if (existingStudent) {
      return NextResponse.json(
        { success: false, message: 'A student with this email already exists.' },
        { status: 409 }
      )
    }

    // ── Verify organization exists ──
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
    })

    if (!organization) {
      return NextResponse.json(
        { success: false, message: 'Organization not found.' },
        { status: 404 }
      )
    }

    // ── Create student ──
    const student = await db.student.create({
      data: {
        name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        avatar: avatar || null,
        isActive: typeof isActive === 'boolean' ? isActive : true,
        isBlocked: typeof isBlocked === 'boolean' ? isBlocked : false,
        blockedReason: isBlocked ? (blockedReason ? sanitizeInput(blockedReason) : null) : null,
        blockedAt: isBlocked ? new Date() : null,
        organizationId,
      },
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

    return NextResponse.json({
      success: true,
      message: 'Student created successfully!',
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
        organization: student.organization,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      },
    })
  } catch (error) {
    console.error('Create student error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
