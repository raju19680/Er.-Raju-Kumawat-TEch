import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')

    const assignments = await db.assignment.findMany({
      where: {
        organizationId: auth.orgId,
        ...(courseId ? { courseId } : {}),
        course: {
          purchasedBy: {
            some: { studentId: student.id }
          }
        }
      },
      include: {
        course: { select: { title: true } },
        submissions: {
          where: { studentId: student.id }
        }
      },
      orderBy: { dueDate: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: assignments
    })
  } catch (error) {
    console.error('Student assignment GET error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
