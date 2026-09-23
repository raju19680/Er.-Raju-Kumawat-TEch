import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get('teacherId')
    const auth = await getAuthUser(req)

    let teacher: any = null

    // 1. If teacherId provided, find that teacher
    if (teacherId) {
      teacher = await db.user.findFirst({
        where: { id: teacherId, role: { in: ['teacher', 'org_admin', 'admin', 'ADMIN', 'platform_admin'] } },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          role: true,
          organizationId: true,
        }
      })
    }

    // 2. If not found or not provided, try to find teacher in student's org
    if (!teacher && auth?.orgId) {
      teacher = await db.user.findFirst({
        where: { organizationId: auth.orgId, role: { in: ['teacher', 'org_admin', 'admin', 'ADMIN', 'platform_admin'] } },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          role: true,
          organizationId: true,
        }
      })
    }

    // 3. Fallback: find any teacher in the database
    if (!teacher) {
      teacher = await db.user.findFirst({
        where: { role: { in: ['teacher', 'org_admin', 'admin', 'ADMIN', 'platform_admin'] } },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          role: true,
          organizationId: true,
        }
      })
    }

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: 'No teacher found' },
        { status: 404 }
      )
    }

    const orgId = teacher.organizationId

    // Parallel fetch of all teacher-synced modules with Promise.allSettled
    const [
      whiteLabelRes,
      orgRes,
      liveClassesRes,
      coursesRes,
      testSeriesRes,
      documentsRes,
      noticesRes,
      doubtsRes,
      studentPurchasesRes,
    ] = await Promise.allSettled([
      // White label config
      db.whiteLabelConfig.findUnique({ where: { teacherId: teacher.id } }),
      // Organization details
      orgId ? db.organization.findUnique({ where: { id: orgId } }) : Promise.resolve(null),
      // Live classes & meetings
      db.meeting.findMany({
        where: orgId ? { organizationId: orgId } : {},
        orderBy: [{ startTime: 'desc' }],
        take: 20,
      }),
      // Courses published
      db.course.findMany({
        where: orgId ? { organizationId: orgId, status: 'published' } : { status: 'published' },
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
          price: true,
          mrp: true,
          category: true,
          level: true,
          language: true,
          status: true,
          modules: {
            select: {
              id: true,
              title: true,
              lessons: { select: { id: true, title: true, videoDuration: true, isFree: true } }
            }
          }
        },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        take: 30,
      }),
      // Test Series
      db.testSeries.findMany({
        where: orgId ? { organizationId: orgId, status: 'published' } : { status: 'published' },
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
            select: {
              id: true,
              title: true,
              totalDuration: true,
              totalMarks: true,
              instructions: true,
            }
          }
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        take: 30,
      }),
      // Documents and study notes
      db.document.findMany({
        where: orgId ? { organizationId: orgId, status: 'active' } : { status: 'active' },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      // Announcements / Notices
      db.notification.findMany({
        where: orgId ? { organizationId: orgId } : {},
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
      // Doubts for logged in student
      Promise.resolve([]),
      // Student's enrolled courses to show progress
      auth?.id ? db.student.findFirst({
        where: { userId: auth.id },
        include: {
          purchasedCourses: { select: { courseId: true } },
        }
      }) : Promise.resolve(null),
    ])

    const wl = whiteLabelRes.status === 'fulfilled' ? whiteLabelRes.value : null
    const org = orgRes.status === 'fulfilled' ? orgRes.value : null
    const liveClasses = liveClassesRes.status === 'fulfilled' ? liveClassesRes.value : []
    const courses = coursesRes.status === 'fulfilled' ? coursesRes.value : []
    const testSeries = testSeriesRes.status === 'fulfilled' ? testSeriesRes.value : []
    const documents = documentsRes.status === 'fulfilled' ? documentsRes.value : []
    const notices = noticesRes.status === 'fulfilled' ? noticesRes.value : []
    const doubts = doubtsRes.status === 'fulfilled' ? doubtsRes.value : []
    const student = studentPurchasesRes.status === 'fulfilled' ? studentPurchasesRes.value : null

    // Map enrolled course IDs
    const enrolledCourseMap = new Map<string, number>()
    if (student?.purchasedCourses) {
      student.purchasedCourses.forEach((pc: any) => {
        enrolledCourseMap.set(pc.courseId, pc.progress || 0)
      })
    }

    const formattedCourses = courses.map((c: any) => ({
      ...c,
      isEnrolled: enrolledCourseMap.has(c.id),
      progress: enrolledCourseMap.get(c.id) || 0,
      totalLessons: c.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0,
    }))

    const formattedTestSeries = testSeries.map((ts: any) => ({
      id: ts.id,
      title: ts.title,
      description: ts.description,
      thumbnail: ts.thumbnail,
      price: ts.price,
      mrp: ts.mrp,
      category: ts.category,
      isCombo: ts.isCombo,
      status: ts.status,
      testCount: ts.tests?.length || 0,
      tests: ts.tests || [],
    }))

    const teacherProfile = {
      id: teacher.id,
      name: teacher.name || 'Faculty Mentor',
      email: teacher.email,
      phone: teacher.phone,
      avatar: teacher.avatar,
      organizationId: teacher.organizationId,
      organizationName: org?.name || wl?.orgName || 'Er. Raju Kumawat Academy',
      organizationLogo: org?.logo || wl?.logo,
      specialization: wl?.heroSubtitle || 'Expert Educator & Mentor',
      tagline: wl?.heroTitle || `Learn directly from ${teacher.name}`,
      about: wl?.footerText || 'Providing comprehensive learning, online live classes, regular test series, and personalized doubt resolution.',
      accentColor: wl?.accentColor || org?.accentColor || '#D97706',
      primaryColor: wl?.primaryColor || org?.accentColor || '#D97706',
      socialLinks: wl?.socialLinks ? JSON.parse(wl.socialLinks) : null,
      stats: {
        totalCourses: formattedCourses.length,
        totalTests: formattedTestSeries.reduce((acc: number, ts: any) => acc + ts.testCount, 0),
        totalLiveClasses: liveClasses.length,
        totalNotes: documents.length,
      }
    }

    return NextResponse.json({
      success: true,
      teacher: teacherProfile,
      liveClasses,
      courses: formattedCourses,
      testSeries: formattedTestSeries,
      documents,
      notices,
      doubts,
    })
  } catch (error) {
    console.error('Fetch teacher-modules error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to load teacher modules' },
      { status: 500 }
    )
  }
}
