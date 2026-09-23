import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get('teacherId') || ''
    let orgCode = searchParams.get('orgCode') || searchParams.get('org') || searchParams.get('organizationId') || searchParams.get('code') || req.headers.get('x-org-code') || ''

    let org = null as any

    // 1. Try resolving organization by teacherId
    if (teacherId) {
      try {
        const teacher = await db.user.findFirst({
          where: { id: teacherId },
          select: { organizationId: true }
        })
        if (teacher?.organizationId) {
          org = await db.organization.findUnique({
            where: { id: teacher.organizationId },
            select: { id: true, name: true, code: true, logo: true, accentColor: true, phone: true }
          })
        }
      } catch (err) {
        console.warn('Teacher lookup warning in student/portal-data:', err)
      }
    }

    // 2. Try resolving organization by orgCode or org ID
    if (!org && orgCode) {
      try {
        org = await db.organization.findUnique({
          where: { code: orgCode },
          select: { id: true, name: true, code: true, logo: true, accentColor: true, phone: true }
        })
        if (!org && orgCode.length >= 20) {
          org = await db.organization.findUnique({
            where: { id: orgCode },
            select: { id: true, name: true, code: true, logo: true, accentColor: true, phone: true }
          })
        }
      } catch (err) {
        console.warn('Org lookup warning in student/portal-data:', err)
      }
    }

    // 3. Fallback to default configured org code
    if (!org) {
      const defaultCode = process.env.NEXT_PUBLIC_DEFAULT_ORG_CODE || 'ERKTACADEMY'
      try {
        org = await db.organization.findUnique({
          where: { code: defaultCode },
          select: { id: true, name: true, code: true, logo: true, accentColor: true, phone: true }
        })
      } catch (err) {
        console.warn('Default org lookup warning in student/portal-data:', err)
      }
    }

    // 4. Fallback to first available org
    if (!org) {
      try {
        org = await db.organization.findFirst({
          select: { id: true, name: true, code: true, logo: true, accentColor: true, phone: true }
        })
      } catch (err) {
        console.warn('First org lookup warning in student/portal-data:', err)
      }
    }

    if (!org) {
      return NextResponse.json(
        { success: false, message: 'Invalid Institute. No organization found.' },
        { status: 404 }
      )
    }

    // Fetch branding config
    let branding: any = null
    let teacher: any = null
    try {
      teacher = teacherId
        ? await db.user.findFirst({ where: { id: teacherId, role: 'teacher' } })
        : await db.user.findFirst({ where: { organizationId: org.id, role: 'teacher' } })
      
      if (teacher) {
        branding = await db.whiteLabelConfig.findUnique({
          where: { teacherId: teacher.id }
        })
      }
    } catch (err) {
      console.warn('Branding fetch warning:', err)
    }

    // Fetch all data for this organization in parallel with settled promises
    const [coursesRes, testSeriesRes, quickLinksRes, bannersRes, categoriesRes, blogsRes] = await Promise.allSettled([
      db.course.findMany({
        where: { organizationId: org.id, status: 'published' },
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
          price: true,
          mrp: true,
          category: true,
          level: true,
          status: true,
        },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      }),
      db.testSeries.findMany({
        where: { organizationId: org.id, status: 'published' },
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
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      db.quickLink.findMany({
        where: { organizationId: org.id },
        select: {
          id: true,
          title: true,
          url: true,
          icon: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: 'asc' },
      }),
      db.banner.findMany({
        where: { organizationId: org.id, isActive: true },
        select: {
          id: true,
          title: true,
          image: true,
          link: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: 'asc' },
      }),
      db.category.findMany({
        where: { organizationId: org.id },
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
        },
        orderBy: { name: 'asc' },
      }),
      db.blog.findMany({
        where: { organizationId: org.id, status: 'published' },
        select: {
          id: true,
          title: true,
          excerpt: true,
          thumbnail: true,
          tags: true,
          createdAt: true,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const rawCourses = coursesRes.status === 'fulfilled' ? coursesRes.value : []
    const rawTestSeries = testSeriesRes.status === 'fulfilled' ? testSeriesRes.value : []
    const quickLinks = quickLinksRes.status === 'fulfilled' ? quickLinksRes.value : []
    const banners = bannersRes.status === 'fulfilled' ? bannersRes.value : []
    const categories = categoriesRes.status === 'fulfilled' ? categoriesRes.value : []
    const blogs = blogsRes.status === 'fulfilled' ? blogsRes.value : []

    // Format test series to include test count
    const formattedTestSeries = rawTestSeries.map((ts: any) => ({
      id: ts.id,
      title: ts.title,
      description: ts.description,
      thumbnail: ts.thumbnail,
      price: ts.price,
      mrp: ts.mrp,
      category: ts.category,
      isCombo: ts.isCombo,
      status: ts.status,
      testCount: ts.tests ? ts.tests.length : 0,
    }))

    const brandingConfig = branding ? {
      orgName: branding.orgName || org.name,
      logo: branding.logo || org.logo,
      primaryColor: branding.primaryColor || org.accentColor,
      accentColor: branding.accentColor || org.accentColor,
      fontFamily: branding.fontFamily || 'Inter',
      heroTitle: branding.heroTitle,
      heroSubtitle: branding.heroSubtitle,
      heroImage: branding.heroImage,
      footerText: branding.footerText,
      socialLinks: branding.socialLinks ? JSON.parse(branding.socialLinks) : null,
      seoTitle: branding.seoTitle,
      seoDescription: branding.seoDescription,
    } : {
      orgName: org.name,
      logo: org.logo,
      primaryColor: org.accentColor,
      accentColor: org.accentColor,
      fontFamily: 'Inter',
      heroTitle: `Welcome to ${org.name}`,
      heroSubtitle: 'Quality education at your fingertips',
    }

    return NextResponse.json({
      success: true,
      org: {
        id: org.id,
        code: org.code,
        name: org.name,
        phone: org.phone,
        accentColor: org.accentColor,
      },
      branding: brandingConfig,
      content: {
        courses: rawCourses,
        testSeries: formattedTestSeries,
        quickLinks,
        banners,
        categories,
        blogs,
      },
      data: {
        organization: org,
        courses: rawCourses,
        testSeries: formattedTestSeries,
        quickLinks,
        banners,
        categories,
        blogs,
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
