import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET - List all published courses (catalog)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')
    const organizationId = searchParams.get('organizationId')

    const where: Record<string, unknown> = { status: 'published' }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }
    if (category && category !== 'all') {
      where.category = category
    }
    if (organizationId) {
      where.organizationId = organizationId
    }

    const courses = await db.course.findMany({
      where,
      include: {
        organization: {
          select: { id: true, name: true, logo: true, accentColor: true },
        },
        modules: {
          include: {
            lessons: true,
          },
        },
        _count: { select: { purchasedBy: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get categories
    const categories = await db.course.findMany({
      where: { status: 'published' },
      select: { category: true },
      distinct: ['category'],
    })

    // If student is logged in, mark enrolled courses
    const session = await getSession()
    let enrolledIds: string[] = []
    if (session && session.role === 'STUDENT') {
      const enrollments = await db.purchasedCourse.findMany({
        where: { studentId: session.id },
        select: { courseId: true },
      })
      enrolledIds = enrollments.map((e) => e.courseId)
    }

    return NextResponse.json({
      success: true,
      courses: courses.map((c) => {
        const totalLessons = c.modules.reduce((acc, m) => acc + m.lessons.length, 0)
        return {
          ...c,
          totalLessons,
          isEnrolled: enrolledIds.includes(c.id),
        }
      }),
      categories: categories.map((c) => c.category).filter(Boolean),
    })
  } catch (error) {
    console.error('Catalog courses error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
