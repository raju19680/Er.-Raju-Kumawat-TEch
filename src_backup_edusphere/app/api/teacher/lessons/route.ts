import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// POST - Add a lesson to a course
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { courseId, title, content, videoUrl, duration, isPreview } = body

    if (!courseId || !title || !content) {
      return NextResponse.json(
        { error: 'Course ID, title, and content are required' },
        { status: 400 }
      )
    }

    // Verify course belongs to teacher
    const course = await db.course.findFirst({
      where: { id: courseId, teacherId: session.id },
    })
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const lessonCount = await db.lesson.count({ where: { courseId } })

    const lesson = await db.lesson.create({
      data: {
        title,
        content,
        videoUrl: videoUrl || null,
        duration: parseInt(duration) || 0,
        isPreview: isPreview || false,
        order: lessonCount,
        courseId,
      },
    })

    // Update course duration
    await db.course.update({
      where: { id: courseId },
      data: { duration: { increment: parseInt(duration) || 0 } },
    })

    return NextResponse.json({ lesson }, { status: 201 })
  } catch (error) {
    console.error('Create lesson error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a lesson
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { lessonId, title, content, videoUrl, duration, isPreview, order } = body

    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 })
    }

    // Verify lesson belongs to teacher's course
    const lesson = await db.lesson.findFirst({
      where: { id: lessonId, course: { teacherId: session.id } },
    })
    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl
    if (duration !== undefined) updateData.duration = parseInt(duration) || 0
    if (isPreview !== undefined) updateData.isPreview = isPreview
    if (order !== undefined) updateData.order = parseInt(order)

    const updated = await db.lesson.update({
      where: { id: lessonId },
      data: updateData,
    })

    return NextResponse.json({ lesson: updated })
  } catch (error) {
    console.error('Update lesson error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a lesson
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const lessonId = searchParams.get('lessonId')

    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 })
    }

    const lesson = await db.lesson.findFirst({
      where: { id: lessonId, course: { teacherId: session.id } },
    })
    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    await db.lesson.delete({ where: { id: lessonId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete lesson error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
