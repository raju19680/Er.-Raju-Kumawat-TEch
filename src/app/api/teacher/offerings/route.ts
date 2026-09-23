export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDemoOrgId } from '@/lib/demo-org'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'offerings')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const orgId = await getDemoOrgId(request)
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const where: Record<string, unknown> = { organizationId: orgId }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (status) {
      where.status = status
    }

    const [offerings, total] = await Promise.all([
      db.offering.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      db.offering.count({ where }),
    ])

    // Enrich with included course/test series titles
    const enriched = await Promise.all(
      offerings.map(async (offering) => {
        let courseIds: string[] = []
        let testSeriesIds: string[] = []
        try { courseIds = JSON.parse(offering.includedCourses) } catch {}
        try { testSeriesIds = JSON.parse(offering.includedTestSeries) } catch {}

        const [courses, testSeries] = await Promise.all([
          courseIds.length > 0
            ? db.course.findMany({ where: { id: { in: courseIds } }, select: { id: true, title: true } })
            : [],
          testSeriesIds.length > 0
            ? db.testSeries.findMany({ where: { id: { in: testSeriesIds } }, select: { id: true, title: true } })
            : [],
        ])

        return {
          ...offering,
          courses,
          testSeriesItems: testSeries,
          featuredBulletsList: (() => { try { return JSON.parse(offering.featuredBullets) } catch { return [] } })(),
        }
      })
    )

    return NextResponse.json({ success: true, offerings: enriched, total })
  } catch (error) {
    console.error('Failed to fetch offerings:', error)
    return NextResponse.json({ error: 'Failed to fetch offerings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'offerings')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()
    const orgId = await getDemoOrgId(request)

    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const offering = await db.offering.create({
      data: {
        title: body.title.trim(),
        description: body.description?.trim() || null,
        thumbnail: body.thumbnail?.trim() || null,
        price: parseFloat(body.price) || 0,
        mrp: parseFloat(body.mrp) || 0,
        validityMode: body.validityMode || 'lifetime',
        validityDays: body.validityDays ? parseInt(body.validityDays) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        includedCourses: JSON.stringify(Array.isArray(body.includedCourses) ? body.includedCourses : []),
        includedTestSeries: JSON.stringify(Array.isArray(body.includedTestSeries) ? body.includedTestSeries : []),
        featuredBullets: JSON.stringify(Array.isArray(body.featuredBullets) ? body.featuredBullets : []),
        status: body.status || 'draft',
        sortOrder: body.sortOrder ?? 0,
        seoTitle: body.seoTitle?.trim() || null,
        seoDescription: body.seoDescription?.trim() || null,
        organizationId: orgId,
      },
    })

    return NextResponse.json({ success: true, offering }, { status: 201 })
  } catch (error) {
    console.error('Failed to create offering:', error)
    return NextResponse.json({ error: 'Failed to create offering' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'offerings')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'Offering ID is required' }, { status: 400 })
    }

    const offering = await db.offering.update({
      where: { id },
      data: {
        title: data.title?.trim(),
        description: data.description?.trim() || null,
        thumbnail: data.thumbnail?.trim() || null,
        price: data.price !== undefined ? parseFloat(data.price) : undefined,
        mrp: data.mrp !== undefined ? parseFloat(data.mrp) : undefined,
        validityMode: data.validityMode,
        validityDays: data.validityDays ? parseInt(data.validityDays) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        includedCourses: data.includedCourses !== undefined ? JSON.stringify(data.includedCourses) : undefined,
        includedTestSeries: data.includedTestSeries !== undefined ? JSON.stringify(data.includedTestSeries) : undefined,
        featuredBullets: data.featuredBullets !== undefined ? JSON.stringify(data.featuredBullets) : undefined,
        status: data.status,
        sortOrder: data.sortOrder,
        seoTitle: data.seoTitle?.trim() || null,
        seoDescription: data.seoDescription?.trim() || null,
      },
    })

    return NextResponse.json({ success: true, offering })
  } catch (error) {
    console.error('Failed to update offering:', error)
    return NextResponse.json({ error: 'Failed to update offering' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'offerings')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Offering ID is required' }, { status: 400 })
    }

    await db.offering.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Offering deleted' })
  } catch (error) {
    console.error('Failed to delete offering:', error)
    return NextResponse.json({ error: 'Failed to delete offering' }, { status: 500 })
  }
}

