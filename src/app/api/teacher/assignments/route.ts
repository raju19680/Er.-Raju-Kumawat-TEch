export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthTeacher } from '@/lib/auth-helpers'

export async function POST(req: NextRequest) {
  try {
    const { auth, teacher, error, status } = await getAuthTeacher(req)
    if (error || !teacher || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const { title, description, dueDate, totalMarks, courseId, moduleId } = await req.json()

    if (!title || !courseId) {
      return NextResponse.json({ success: false, message: 'Title and Course ID are required' }, { status: 400 })
    }

    const assignment = await db.assignment.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        totalMarks: totalMarks || 100,
        courseId,
        moduleId,
        organizationId: auth.orgId,
      }
    })

    return NextResponse.json({
      success: true,
      data: assignment
    })
  } catch (error) {
    console.error('Teacher assignment POST error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { auth, teacher, error, status } = await getAuthTeacher(req)
    if (error || !teacher || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')

    const assignments = await db.assignment.findMany({
      where: {
        organizationId: auth.orgId,
        ...(courseId ? { courseId } : {})
      },
      include: {
        course: { select: { title: true } },
        _count: { select: { submissions: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: assignments
    })
  } catch (error) {
    console.error('Teacher assignment GET error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

