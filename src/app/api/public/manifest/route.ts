import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/public/manifest
 *
 * Returns a dynamic PWA manifest per organization.
 * This allows each teacher's website to have its own branded app icon,
 * name, and colors when installed on mobile devices.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    let orgCode = req.headers.get('x-org-code') || searchParams.get('orgCode') || '9680177120'
    
    const org = await db.organization.findUnique({ where: { code: orgCode } })
    
    if (!org) {
      // Return default manifest
      return NextResponse.json({
        name: 'Er. Raju Kumawat Tech',
        short_name: 'ERKT',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#D97706',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      })
    }

    // Get branding
    const teacher = await db.user.findFirst({
      where: { organizationId: org.id, role: 'teacher' }
    })
    
    let branding: any = null
    if (teacher) {
      branding = await db.whiteLabelConfig.findUnique({
        where: { teacherId: teacher.id }
      })
    }

    const appName = branding?.orgName || org.name
    const shortName = appName.length > 12 ? appName.substring(0, 12) : appName
    const themeColor = branding?.primaryColor || org.accentColor || '#D97706'

    return NextResponse.json({
      name: appName,
      short_name: shortName,
      description: branding?.seoDescription || `${appName} - Education Platform`,
      start_url: '/?orgCode=' + org.code,
      scope: '/',
      display: 'standalone',
      orientation: 'portrait-primary',
      background_color: '#ffffff',
      theme_color: themeColor,
      icons: [
        { src: branding?.logo || '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: branding?.logo || '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
      ],
      categories: ['education', 'productivity'],
      lang: 'en',
    })
  } catch (error) {
    console.error('Manifest error:', error)
    return NextResponse.json({
      name: 'Education Platform',
      short_name: 'EduApp',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#D97706',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
      ]
    })
  }
}
