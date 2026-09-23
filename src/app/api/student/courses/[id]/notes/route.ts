import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

// GET /api/student/courses/[id]/notes?lessonId=xxx
export async function GET(
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
    
    const { searchParams } = new URL(req.url)
    const lessonId = searchParams.get('lessonId')

    const student = await db.student.findFirst({ where: { userId: auth.id } })
    if (!student) return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 })

    const whereClause: any = { studentId: student.id }
    if (lessonId) whereClause.lessonId = lessonId

    // Cross-verify course access
    const { id: courseId } = await params
    const purchase = await db.purchasedCourse.findFirst({ where: { studentId: student.id, courseId } })
    if (!purchase) {
        // If not purchased, verify lesson is free
        if (lessonId) {
            const lesson = await db.courseLesson.findFirst({ where: { id: lessonId } })
            if (!lesson?.isFree) {
                return NextResponse.json({ success: false, message: 'Lesson locked' }, { status: 403 })
            }
        } else {
             return NextResponse.json({ success: false, message: 'Course not purchased' }, { status: 403 })
        }
    }

    const notes = await db.courseNote.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
          lesson: {
              select: { title: true }
          }
      }
    })
    return NextResponse.json({ success: true, notes })
  } catch (error) {
    console.error('Fetch notes error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/student/courses/[id]/notes
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

    const student = await db.student.findFirst({ where: { userId: auth.id } })
    if (!student) return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 })

    const body = await req.json()
    const { lessonId, content, timestamp } = body

    if (!lessonId || !content) return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 })

    const note = await db.courseNote.create({
      data: {
        studentId: student.id,
        lessonId,
        content,
        timestamp: timestamp || null,
        organizationId: auth.orgId,
      }
    })
    return NextResponse.json({ success: true, note }, { status: 201 })
  } catch (error) {
    console.error('Create note error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/student/courses/[id]/notes?id=xxx
export async function DELETE(
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
  
      const student = await db.student.findFirst({ where: { userId: auth.id } })
      if (!student) return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 })
  
      const { searchParams } = new URL(req.url)
      const noteId = searchParams.get('id')
      if (!noteId) return NextResponse.json({ success: false, message: 'Note id required' }, { status: 400 })
  
      // Verify note ownership
      const existing = await db.courseNote.findFirst({ where: { id: noteId, studentId: student.id } })
      if (!existing) return NextResponse.json({ success: false, message: 'Note not found' }, { status: 404 })
  
      await db.courseNote.delete({ where: { id: noteId } })
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Delete note error:', error)
      return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
    }
  }
