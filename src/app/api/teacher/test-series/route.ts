export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'
import { resolveOrgId } from '@/lib/demo-org'

// resolveOrgId imported from demo-org

export async function GET(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'test-series')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const orgId = await resolveOrgId(request, searchParams.get('organizationId') || undefined)

    const parentId = searchParams.get('parentId')

    const where: Record<string, unknown> = { organizationId: orgId }
    
    // Only apply parentId filter if it's explicitly provided, otherwise default to null for root, or ignore if searching
    if (search) {
      // when searching, we might want to search across all levels
    } else if (parentId !== null) {
      where.parentId = parentId === 'null' ? null : parentId
    } else {
      where.parentId = null // Default to root level
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const [items, total] = await Promise.all([
      db.testSeries.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { tests: true } },
        },
      }),
      db.testSeries.count({ where }),
    ])

    const formatted = items.map((item) => ({
      ...item,
      testCount: item._count.tests,
    }))

    return NextResponse.json({ items: formatted, total, page, limit })
  } catch (error: any) {
    console.error('Failed to fetch test series:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch test series', details: error.stack }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'test-series')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const orgId = await resolveOrgId(request, body.organizationId)

    const testSeries = await db.testSeries.create({
      data: {
        title: body.title,
        description: body.description || null,
        thumbnail: body.thumbnail || null,
        price: body.price ?? 0,
        mrp: body.mrp ?? 0,
        discount: body.discount ?? 0,
        category: body.category || null,
        isCombo: body.isCombo ?? false,
        includeTestMaker: body.includeTestMaker ?? false,
        allowPayment: body.allowPayment ?? true,
        validityMode: body.validityMode || 'lifetime',
        validityDays: body.validityDays || null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        seoTitle: body.seoTitle || null,
        seoDescription: body.seoDescription || null,
        richSnippets: body.richSnippets ?? false,
        sortOrder: body.sortOrder ?? 0,
        status: body.status || 'draft',
        organizationId: orgId,
        parentId: body.parentId || null,
      },
    })

    return NextResponse.json(testSeries, { status: 201 })
  } catch (error) {
    console.error('Failed to create test series:', error)
    return NextResponse.json({ error: 'Failed to create test series' }, { status: 500 })
  }
}

