import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) { return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 }) }
const normalizedRole = String(auth.role).toLowerCase()
    const isStudent = normalizedRole === 'student'
    const isTeacher = ['teacher', 'org_admin', 'admin', 'platform_admin'].includes(normalizedRole)
    if (!isStudent && !isTeacher) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    const { id: courseId } = await params
    const body = await req.json()
    const { lessonId, status, lastPosition } = body

    if (!lessonId) {
      return NextResponse.json({ success: false, message: 'lessonId required' }, { status: 400 })
    }

    const student = await db.student.findFirst({ where: { userId: auth.id } })
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 })
    }

    // Upsert lesson progress
    const progress = await db.lessonProgress.upsert({
      where: {
        studentId_lessonId: {
          studentId: student.id,
          lessonId,
        }
      },
      update: {
        ...(status ? { status } : {}),
        ...(status === 'completed' ? { completedAt: new Date() } : {}),
        ...(status === 'not_started' ? { completedAt: null } : {}),
        ...(lastPosition !== undefined ? { lastPosition: String(lastPosition) } : {})
      },
      create: {
        studentId: student.id,
        lessonId,
        courseId,
        status: status || 'in_progress',
        lastPosition: lastPosition !== undefined ? String(lastPosition) : null,
        completedAt: status === 'completed' ? new Date() : null
      }
    })

    return NextResponse.json({ success: true, progress })
  } catch (error) {
    console.error('Update progress error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
