import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const orgCode = req.nextUrl.searchParams.get('orgCode')
    const teacherId = req.nextUrl.searchParams.get('teacherId')

    interface OrgData {
      id: string;
      code: string;
      name: string;
      logo: string | null | undefined;
      accentColor: string | undefined;
      banner?: string | null;
    }
    
    let orgId = ''
    let orgData: OrgData | null = null

    if (teacherId) {
      // Find teacher
      const teacher = await db.user.findUnique({
        where: { id: teacherId, role: 'teacher' },
        select: {
          id: true,
          name: true,
          avatar: true,
          bannerImage: true,
          portalLogo: true,
          organization: {
            select: { id: true, code: true, name: true, logo: true, accentColor: true }
          }
        }
      })

      if (teacher) {
        orgId = teacher.organization?.id || ''
        orgData = {
          id: teacher.id,
          code: teacher.organization?.code || '',
          name: teacher.name || teacher.organization?.name || 'Instructor',
          logo: teacher.portalLogo || teacher.avatar || teacher.organization?.logo,
          accentColor: teacher.organization?.accentColor,
          banner: teacher.bannerImage
        }
      }
    }

    if (!orgData && orgCode) {
      const org = await db.organization.findUnique({
        where: { code: orgCode },
        select: {
          id: true,
          name: true,
          code: true,
          logo: true,
          accentColor: true,
        },
      })
      if (org) {
        orgId = org.id
        orgData = {
          id: org.id,
          code: org.code,
          name: org.name,
          logo: org.logo,
          accentColor: org.accentColor,
        }
      }
    }

    if (!orgData || !orgId) {
      return NextResponse.json(
        { success: false, message: 'Invalid Institute ID or Teacher ID.' },
        { status: 404 }
      )
    }

    // Fetch all data for this organization in parallel
    const [courses, testSeries, quickLinks, banners, categories] = await Promise.all([
      // Courses - only published ones
      db.course.findMany({
        where: { organizationId: orgId, status: 'published' },
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
          price: true,
          mrp: true,
          category: true,
          status: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Test Series - only published ones, with test count
      db.testSeries.findMany({
        where: { organizationId: orgId, status: 'published' },
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
          price: true,
          mrp: true,
          category: true,
          isCombo: true,
          status: true,
          tests: {
            select: { id: true },
          },
        },
        orderBy: { sortOrder: 'asc' },
      }),
      // Quick Links
      db.quickLink.findMany({
        where: { organizationId: orgId },
        select: {
          id: true,
          title: true,
          url: true,
          icon: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: 'asc' },
      }),
      // Banners - only active ones
      db.banner.findMany({
        where: { organizationId: orgId, isActive: true },
        select: {
          id: true,
          title: true,
          image: true,
          link: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: 'asc' },
      }),
      // Categories
      db.category.findMany({
        where: { organizationId: orgId },
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
        },
        orderBy: { name: 'asc' },
      }),
    ])

    // Format test series to include test count
    const formattedTestSeries = testSeries.map((ts) => ({
      id: ts.id,
      title: ts.title,
      description: ts.description,
      thumbnail: ts.thumbnail,
      price: ts.price,
      mrp: ts.mrp,
      category: ts.category,
      isCombo: ts.isCombo,
      status: ts.status,
      testCount: ts.tests.length,
    }))

    return NextResponse.json({
      success: true,
      data: {
        organization: orgData,
        courses,
        testSeries: formattedTestSeries,
        quickLinks,
        banners,
        categories,
      },
    })
  } catch (error) {
    console.error('Portal data error:', error)
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
