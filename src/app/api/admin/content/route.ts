export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  // ── Auth check ──
  const authResult = await requirePlatformAdmin(req)
  if ('error' in authResult) {
    return NextResponse.json(
      { success: false, message: authResult.error },
      { status: authResult.status }
    )
  }

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim() || ''
    const orgFilter = searchParams.get('organizationId')?.trim() || ''

    // Build organization filter
    const orgWhere = orgFilter ? { organizationId: orgFilter } : {}

    // Build search filter helper
    function buildSearchFilter(searchFields: string[]) {
      if (!search) return orgWhere
      return {
        ...orgWhere,
        OR: searchFields.map((field) => ({
          [field]: { contains: search },
        })),
      }
    }

    // ── Fetch all content in parallel ──
    const [courses, testSeries, tests, banners, blogs] = await Promise.all([
      db.course.findMany({
        where: buildSearchFilter(['title', 'category']),
        select: {
          id: true,
          title: true,
          category: true,
          price: true,
          mrp: true,
          status: true,
          thumbnail: true,
          createdAt: true,
          organizationId: true,
          organization: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.testSeries.findMany({
        where: buildSearchFilter(['title', 'category']),
        select: {
          id: true,
          title: true,
          category: true,
          price: true,
          mrp: true,
          status: true,
          thumbnail: true,
          createdAt: true,
          organizationId: true,
          organization: {
            select: { id: true, name: true, code: true },
          },
          _count: { select: { tests: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.test.findMany({
        where: buildSearchFilter(['title']),
        select: {
          id: true,
          title: true,
          status: true,
          numberOfQuestions: true,
          totalMarks: true,
          totalDuration: true,
          createdAt: true,
          organizationId: true,
          testSeriesId: true,
          organization: {
            select: { id: true, name: true, code: true },
          },
          testSeries: {
            select: { id: true, title: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.banner.findMany({
        where: buildSearchFilter(['title']),
        select: {
          id: true,
          title: true,
          image: true,
          link: true,
          isActive: true,
          sortOrder: true,
          createdAt: true,
          organizationId: true,
          organization: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.blog.findMany({
        where: buildSearchFilter(['title', 'tags']),
        select: {
          id: true,
          title: true,
          excerpt: true,
          thumbnail: true,
          tags: true,
          status: true,
          createdAt: true,
          organizationId: true,
          organization: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // ── Compute stats (unfiltered, always full counts) ──
    const [
      totalCourses,
      totalTestSeries,
      totalTests,
      totalBanners,
      totalBlogs,
      publishedCourses,
      publishedTests,
    ] = await Promise.all([
      db.course.count({ where: orgWhere }),
      db.testSeries.count({ where: orgWhere }),
      db.test.count({ where: orgWhere }),
      db.banner.count({ where: orgWhere }),
      db.blog.count({ where: orgWhere }),
      db.course.count({ where: { ...orgWhere, status: 'published' } }),
      db.test.count({ where: { ...orgWhere, status: 'paid' } }),
    ])

    // ── Fetch organizations for filter ──
    const organizations = await db.organization.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      success: true,
      courses,
      testSeries,
      tests,
      banners,
      blogs,
      organizations,
      stats: {
        totalCourses,
        totalTestSeries,
        totalTests,
        totalBanners,
        totalBlogs,
        publishedCourses,
        publishedTests,
      },
    })
  } catch (error) {
    console.error('[ADMIN/CONTENT] Error fetching content:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch content overview.' },
      { status: 500 }
    )
  }
}
