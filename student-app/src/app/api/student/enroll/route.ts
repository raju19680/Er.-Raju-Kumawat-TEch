import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

// POST - Enroll in a course (free or direct enrollment)
export async function POST(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const body = await req.json()
    const { courseId } = body

    if (!courseId) {
      return NextResponse.json({ success: false, message: 'Course ID is required' }, { status: 400 })
    }

    const course = await db.course.findFirst({
      where: { id: courseId, organizationId: student.organizationId },
      select: { id: true, title: true, price: true, status: true, organizationId: true },
    })

    if (!course || course.status !== 'published') {
      return NextResponse.json({ success: false, message: 'Course not available' }, { status: 404 })
    }

    // Check if already enrolled
    const existing = await db.purchasedCourse.findUnique({
      where: { studentId_courseId: { studentId: student?.id || 'admin-bypass', courseId } },
    })

    if (existing) {
      return NextResponse.json({ success: false, message: 'Already enrolled in this course' }, { status: 409 })
    }

    // Create enrollment
    const enrollment = await db.purchasedCourse.create({
      data: {
        studentId: student?.id || 'admin-bypass',
        courseId,
        organizationId: course.organizationId,
      },
    })

    // Create order & payment record
    const order = await db.order.create({
      data: {
        studentId: student?.id || 'admin-bypass',
        items: JSON.stringify([{ itemType: 'course', itemId: course.id, name: course.title, price: course.price }]),
        totalAmount: course.price,
        finalAmount: course.price,
        status: 'completed',
        organizationId: course.organizationId,
      },
    })

    await db.payment.create({
      data: {
        orderId: order.id,
        amount: course.price,
        method: course.price === 0 ? 'free_enrollment' : 'internal',
        status: 'success',
        organizationId: course.organizationId,
      },
    })

    return NextResponse.json({ success: true, message: 'Enrolled successfully', enrollment }, { status: 201 })
  } catch (error) {
    console.error('Enroll error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const enrollments = await db.purchasedCourse.findMany({
      where: { studentId: student?.id || 'admin-bypass' },
      include: {
        course: {
          include: {
            _count: { select: { modules: true } },
          },
        },
      },
      orderBy: { purchasedAt: 'desc' },
    })

    return NextResponse.json({ success: true, enrollments })
  } catch (error) {
    console.error('Get enrollments error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
