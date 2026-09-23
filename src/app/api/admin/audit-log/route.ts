export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// ── Seed demo data if no audit logs exist ──────────────────────────────────────



// ── Valid categories ────────────────────────────────────────────────────────────

const VALID_CATEGORIES = ['auth', 'teacher', 'student', 'organization', 'content', 'settings', 'system']

// ── GET handler ─────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requirePlatformAdmin(req)
  if ('error' in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  try {
    // Seed demo data if empty

    // Parse query params
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const category = searchParams.get('category') || undefined
    const action = searchParams.get('action') || undefined
    const search = searchParams.get('search') || undefined
    const dateFrom = searchParams.get('dateFrom') || undefined
    const dateTo = searchParams.get('dateTo') || undefined

    // Build where clause
    const where: Prisma.AuditLogWhereInput = {}

    if (category && VALID_CATEGORIES.includes(category)) {
      where.category = category
    }

    if (action) {
      where.action = { contains: action }
    }

    if (search) {
      where.OR = [
        { userName: { contains: search } },
        { action: { contains: search } },
        { details: { contains: search } },
      ]
    }

    if (dateFrom || dateTo) {
      const createdAtFilter: Prisma.DateTimeFilter = {}
      if (dateFrom) {
        createdAtFilter.gte = new Date(dateFrom)
      }
      if (dateTo) {
        // Add one day to include the entire end date
        const toDate = new Date(dateTo)
        toDate.setDate(toDate.getDate() + 1)
        createdAtFilter.lt = toDate
      }
      where.createdAt = createdAtFilter
    }

    // Fetch paginated logs and stats in parallel
    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ])

    // ── Stats ──
    const [totalAll, byCategoryRows, recentCount] = await Promise.all([
      db.auditLog.count(),
      db.auditLog.groupBy({
        by: ['category'],
        _count: { category: true },
      }),
      db.auditLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // last 24 hours
          },
        },
      }),
    ])

    // Build byCategory map with all categories initialized to 0
    const byCategory: Record<string, number> = {}
    for (const cat of VALID_CATEGORIES) {
      byCategory[cat] = 0
    }
    for (const row of byCategoryRows) {
      byCategory[row.category] = row._count.category
    }

    // Format logs for response
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      userName: log.userName,
      userRole: log.userRole,
      action: log.action,
      category: log.category,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      organizationId: log.organizationId,
      createdAt: log.createdAt.toISOString(),
    }))

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      stats: {
        total: totalAll,
        byCategory,
        recentCount,
      },
    })
  } catch (error) {
    console.error('[ADMIN AUDIT LOG] Error fetching audit log data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit log data' },
      { status: 500 }
    )
  }
}
