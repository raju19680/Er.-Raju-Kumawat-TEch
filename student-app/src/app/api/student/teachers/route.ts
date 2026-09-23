import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orgCodeParam = searchParams.get('orgCode') || searchParams.get('org') || ''

    let organizationId: string | null = null

    // Try getting organizationId from auth if student is logged in
    const auth = await getAuthUser(req)
    if (auth?.orgId) {
      organizationId = auth.orgId
    }

    // Otherwise resolve orgCode
    if (!organizationId && orgCodeParam) {
      const org = await db.organization.findUnique({
        where: { code: orgCodeParam },
        select: { id: true }
      })
      if (org) organizationId = org.id
    }

    if (!organizationId) {
      const defaultCode = process.env.NEXT_PUBLIC_DEFAULT_ORG_CODE || 'ERKTACADEMY'
      const org = await db.organization.findUnique({
        where: { code: defaultCode },
        select: { id: true }
      })
      if (org) organizationId = org.id
    }

    // Fetch teachers with their branding and counts
    const teachersWhere: any = { role: { in: ['teacher', 'org_admin', 'admin', 'ADMIN', 'platform_admin'] } }
    if (organizationId) {
      teachersWhere.organizationId = organizationId
    }

    const teachers = await db.user.findMany({
      where: teachersWhere,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        organizationId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' }
    })

    // If no teachers found for this organization, fallback to any teacher or create default profile
    let effectiveTeachers = teachers
    if (effectiveTeachers.length === 0) {
      effectiveTeachers = await db.user.findMany({
        where: { role: { in: ['teacher', 'org_admin', 'admin', 'ADMIN', 'platform_admin'] } },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          role: true,
          organizationId: true,
          createdAt: true,
        },
        take: 5
      })
    }

    // Enrich teachers with whiteLabelConfig and counts
    const enrichedTeachers = await Promise.all(
      effectiveTeachers.map(async (t) => {
        const [whiteLabel, courseCount, testCount, meetingCount, docCount] = await Promise.allSettled([
          db.whiteLabelConfig.findUnique({ where: { teacherId: t.id } }),
          db.course.count({ where: { organizationId: t.organizationId || undefined, status: 'published' } }),
          db.testSeries.count({ where: { organizationId: t.organizationId || undefined, status: 'published' } }),
          db.meeting.count({ where: { organizationId: t.organizationId || undefined } }),
          db.document.count({ where: { organizationId: t.organizationId || undefined, status: 'active' } }),
        ])

        const wl = whiteLabel.status === 'fulfilled' ? whiteLabel.value : null

        return {
          id: t.id,
          name: t.name || 'Faculty Member',
          email: t.email,
          phone: t.phone,
          avatar: t.avatar,
          organizationId: t.organizationId,
          specialization: wl?.heroSubtitle || 'Senior Faculty & Mentor',
          bio: wl?.heroTitle || `Welcome to ${t.name}'s Classroom`,
          about: wl?.footerText || 'Dedicated educator offering personalized learning, tests, and live interactive classes.',
          logo: wl?.logo,
          accentColor: wl?.accentColor || '#D97706',
          coursesCount: courseCount.status === 'fulfilled' ? courseCount.value : 0,
          testSeriesCount: testCount.status === 'fulfilled' ? testCount.value : 0,
          liveClassesCount: meetingCount.status === 'fulfilled' ? meetingCount.value : 0,
          documentsCount: docCount.status === 'fulfilled' ? docCount.value : 0,
          socialLinks: wl?.socialLinks ? JSON.parse(wl.socialLinks) : null,
        }
      })
    )

    return NextResponse.json({
      success: true,
      teachers: enrichedTeachers,
      defaultTeacher: enrichedTeachers[0] || null,
    })
  } catch (error) {
    console.error('Fetch student teachers error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to load teachers' },
      { status: 500 }
    )
  }
}
