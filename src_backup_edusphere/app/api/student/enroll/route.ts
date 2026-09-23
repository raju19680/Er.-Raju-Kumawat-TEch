import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// POST - Enroll in a course (free or paid - creates enrollment + payment record)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { courseId } = body

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, price: true, isPublished: true, teacherId: true },
    })

    if (!course || !course.isPublished) {
      return NextResponse.json({ error: 'Course not available' }, { status: 404 })
    }

    // Check if already enrolled
    const existing = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: session.id, courseId } },
    })

    if (existing) {
      return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 409 })
    }

    // Create enrollment (free enrollment for now; payment integration would happen here)
    const enrollment = await db.enrollment.create({
      data: {
        userId: session.id,
        courseId,
      },
    })

    // Create payment record
    if (course.price > 0) {
      await db.payment.create({
        data: {
          userId: session.id,
          amount: course.price,
          type: 'COURSE',
          itemId: course.id,
          itemName: course.title,
          status: 'COMPLETED', // Simulating successful payment
        },
      })
    }

    return NextResponse.json({ enrollment }, { status: 201 })
  } catch (error) {
    console.error('Enroll error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - List student's enrollments
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const enrollments = await db.enrollment.findMany({
      where: { userId: session.id },
      include: {
        course: {
          include: {
            teacher: {
              select: { id: true, name: true, username: true, avatar: true },
            },
            _count: { select: { lessons: true } },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    })

    return NextResponse.json({ enrollments })
  } catch (error) {
    console.error('Get enrollments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
