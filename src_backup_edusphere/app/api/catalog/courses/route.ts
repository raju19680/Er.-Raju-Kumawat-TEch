import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET - List all published courses (catalog)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')
    const teacherId = searchParams.get('teacherId')

    const where: Record<string, unknown> = { isPublished: true }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }
    if (category && category !== 'all') {
      where.category = category
    }
    if (teacherId) {
      where.teacherId = teacherId
    }

    const courses = await db.course.findMany({
      where,
      include: {
        teacher: {
          select: { id: true, name: true, username: true, avatar: true, organisationId: true },
        },
        _count: { select: { lessons: true, enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get categories
    const categories = await db.course.findMany({
      where: { isPublished: true },
      select: { category: true },
      distinct: ['category'],
    })

    // If student is logged in, mark enrolled courses
    const session = await getSession()
    let enrolledIds: string[] = []
    if (session && session.role === 'STUDENT') {
      const enrollments = await db.enrollment.findMany({
        where: { userId: session.id },
        select: { courseId: true },
      })
      enrolledIds = enrollments.map((e) => e.courseId)
    }

    return NextResponse.json({
      courses: courses.map((c) => ({ ...c, isEnrolled: enrolledIds.includes(c.id) })),
      categories: categories.map((c) => c.category).filter(Boolean),
    })
  } catch (error) {
    console.error('Get catalog courses error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
