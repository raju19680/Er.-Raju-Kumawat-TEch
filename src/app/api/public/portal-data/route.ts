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
    
    // Strategy 2: Check query param (support orgCode, org, organizationId, code)
    if (!orgCode) {
      orgCode = searchParams.get('orgCode') || searchParams.get('org') || searchParams.get('organizationId') || searchParams.get('code') || ''
    }
    
    // Strategy 3: Check domain query param
    const domain = searchParams.get('domain') || ''
    
    let org = null as any
    
    if (domain) {
      // Lookup by custom domain
      const customDomain = await db.customDomain.findUnique({
        where: { domain }
      })
      if (customDomain?.organizationId) {
        org = await db.organization.findUnique({
          where: { id: customDomain.organizationId }
        })
      }
    }
    
    if (!org && orgCode) {
      // Try by code first, then by id if code didn't match
      org = await db.organization.findUnique({
        where: { code: orgCode }
      })
      if (!org && orgCode.length >= 20) {
        org = await db.organization.findUnique({
          where: { id: orgCode }
        })
      }
    }
    
    // Strategy 4: Default to configured default org or first available org
    if (!org) {
      const defaultCode = process.env.NEXT_PUBLIC_DEFAULT_ORG_CODE || 'ERKTACADEMY'
      org = await db.organization.findUnique({
        where: { code: defaultCode }
      })
    }

    if (!org) {
      org = await db.organization.findFirst()
    }
    
    if (!org) {
      return NextResponse.json(
        { success: false, message: 'Organization not found' },
        { status: 404 }
      )
    }

    // Fetch branding config
    const teacher = await db.user.findFirst({
      where: { organizationId: org.id, role: 'teacher' }
    })
    
    let branding: any = null
    if (teacher) {
      branding = await db.whiteLabelConfig.findUnique({
        where: { teacherId: teacher.id }
      })
    }

    // Fetch public content
    const [courses, testSeries, quickLinks, banners, categories, blogs] = await Promise.all([
      db.course.findMany({
        where: { organizationId: org.id, status: 'published' },
        select: { id: true, title: true, description: true, thumbnail: true, price: true, mrp: true, category: true, level: true },
        take: 20,
      }),
      db.testSeries.findMany({
        where: { organizationId: org.id, status: 'published' },
        select: { id: true, title: true, description: true, thumbnail: true, price: true, mrp: true, category: true },
        take: 20,
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

    // Build branding response
    const brandingConfig = branding ? {
      orgName: branding.orgName || org.name,
      logo: branding.logo || org.logo || teacher?.avatar,
      favicon: branding.favicon || teacher?.avatar,
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
      logo: org.logo || teacher?.avatar,
      favicon: teacher?.avatar,
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
