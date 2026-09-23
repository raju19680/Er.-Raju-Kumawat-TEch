import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/public/portal-data
 *
 * Public endpoint that returns organization branding + content for the
 * white-labeled student portal. No authentication required.
 *
 * Resolution order:
 * 1. x-org-code header (set by middleware based on Host header)
 * 2. ?orgCode= query parameter
 * 3. ?domain= query parameter (custom domain lookup)
 * 4. Default: platform org (9680177120)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    // Strategy 1: Check middleware-injected header
    let orgCode = req.headers.get('x-org-code') || ''
    
    // Strategy 2: Check query param (support orgCode, org, organizationId, code, teacherId)
    const teacherId = searchParams.get('teacherId') || ''
    if (!orgCode) {
      orgCode = searchParams.get('orgCode') || searchParams.get('org') || searchParams.get('organizationId') || searchParams.get('code') || ''
    }
    
    // Strategy 3: Check domain query param
    const domain = searchParams.get('domain') || ''
    
    let org = null as any
    
    if (teacherId) {
      try {
        const teacherUser = await db.user.findFirst({
          where: { id: teacherId }
        })
        if (teacherUser?.organizationId) {
          org = await db.organization.findUnique({
            where: { id: teacherUser.organizationId }
          })
        }
      } catch (err) {
        console.warn('Teacher lookup warning:', err)
      }
    }
    
    if (!org && domain) {
      // Lookup by custom domain
      try {
        const customDomain = await db.customDomain.findUnique({
          where: { domain }
        })
        if (customDomain?.organizationId) {
          org = await db.organization.findUnique({
            where: { id: customDomain.organizationId }
          })
        }
      } catch (err) {
        console.warn('Custom domain lookup warning:', err)
      }
    }
    
    if (!org && orgCode) {
      // Try by code first, then by id if code didn't match
      try {
        org = await db.organization.findUnique({
          where: { code: orgCode }
        })
        if (!org && orgCode.length >= 20) {
          org = await db.organization.findUnique({
            where: { id: orgCode }
          })
        }
      } catch (err) {
        console.warn('Org lookup warning:', err)
      }
    }
    
    // Strategy 4: Default to configured default org or first available org
    if (!org) {
      const defaultCode = process.env.NEXT_PUBLIC_DEFAULT_ORG_CODE || 'ERKTACADEMY'
      try {
        org = await db.organization.findUnique({
          where: { code: defaultCode }
        })
      } catch (err) {
        console.warn('Default org lookup warning:', err)
      }
    }

    if (!org) {
      try {
        org = await db.organization.findFirst()
      } catch (err) {
        console.warn('First org lookup warning:', err)
      }
    }
    
    if (!org) {
      return NextResponse.json(
        { success: false, message: 'Organization not found' },
        { status: 404 }
      )
    }

    // Fetch branding config
    let branding: any = null
    let teacher: any = null
    try {
      teacher = teacherId
        ? await db.user.findFirst({ where: { id: teacherId, role: { in: ['teacher', 'org_admin', 'admin', 'ADMIN', 'platform_admin'] } } })
        : await db.user.findFirst({ where: { organizationId: org.id, role: { in: ['teacher', 'org_admin', 'admin', 'ADMIN', 'platform_admin'] } } })
      
      if (teacher) {
        branding = await db.whiteLabelConfig.findUnique({
          where: { teacherId: teacher.id }
        })
      }
    } catch (err) {
      console.warn('Branding fetch warning:', err)
    }

    // Fetch public content with resilient fallbacks
    const [coursesRes, testSeriesRes, quickLinksRes, bannersRes, categoriesRes, blogsRes] = await Promise.allSettled([
      db.course.findMany({
        where: { organizationId: org.id, status: 'published' },
        select: { id: true, title: true, description: true, thumbnail: true, price: true, mrp: true, category: true, demoVideo: true },
        take: 30,
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      }),
      db.testSeries.findMany({
        where: { organizationId: org.id, status: 'published' },
        select: { id: true, title: true, description: true, thumbnail: true, price: true, mrp: true, category: true },
        take: 30,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      db.quickLink.findMany({
        where: { organizationId: org.id },
        select: { id: true, title: true, url: true, icon: true, sortOrder: true },
        orderBy: { sortOrder: 'asc' },
      }),
      db.banner.findMany({
        where: { organizationId: org.id, isActive: true },
        select: { id: true, title: true, image: true, link: true, sortOrder: true },
        orderBy: { sortOrder: 'asc' },
      }),
      db.category.findMany({
        where: { organizationId: org.id },
        select: { id: true, name: true, slug: true, icon: true },
      }),
      db.blog.findMany({
        where: { organizationId: org.id, status: 'published' },
        select: { id: true, title: true, excerpt: true, thumbnail: true, tags: true, createdAt: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const courses = coursesRes.status === 'fulfilled' ? coursesRes.value : []
    const testSeries = testSeriesRes.status === 'fulfilled' ? testSeriesRes.value : []
    const quickLinks = quickLinksRes.status === 'fulfilled' ? quickLinksRes.value : []
    const banners = bannersRes.status === 'fulfilled' ? bannersRes.value : []
    const categories = categoriesRes.status === 'fulfilled' ? categoriesRes.value : []
    const blogs = blogsRes.status === 'fulfilled' ? blogsRes.value : []

    // Build branding response
    const brandingConfig = branding ? {
      orgName: branding.orgName || org.name,
      logo: branding.logo || teacher?.portalLogo || teacher?.avatar || org.logo,
      favicon: branding.favicon || branding.logo || teacher?.portalLogo || teacher?.avatar || org.logo,
      primaryColor: branding.primaryColor || org.accentColor,
      secondaryColor: branding.secondaryColor,
      accentColor: branding.accentColor || org.accentColor,
      fontFamily: branding.fontFamily || 'Inter',
      customCSS: branding.customCSS,
      heroTitle: branding.heroTitle,
      heroSubtitle: branding.heroSubtitle,
      heroImage: branding.heroImage,
      footerText: branding.footerText,
      socialLinks: branding.socialLinks ? JSON.parse(branding.socialLinks) : null,
      seoTitle: branding.seoTitle,
      seoDescription: branding.seoDescription,
      pwaEnabled: branding.pwaEnabled,
    } : {
      orgName: org.name,
      logo: teacher?.avatar || org.logo,
      favicon: teacher?.avatar || org.logo,
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
        courses,
        testSeries,
        quickLinks,
        banners,
        categories,
        blogs,
      },
      // Also provide 'data' wrapper for components that expect it (my-courses.tsx, public-portal.tsx)
      data: {
        organization: { id: org.id, code: org.code, name: org.name, logo: org.logo, accentColor: org.accentColor },
        courses,
        testSeries,
        quickLinks,
        banners,
        categories,
        blogs,
      },
    })
  } catch (error) {
    console.error('Public portal data error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to load portal data' },
      { status: 500 }
    )
  }
}
