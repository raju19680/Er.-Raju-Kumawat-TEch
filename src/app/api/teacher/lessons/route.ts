export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

// POST - Add a lesson to a course module
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthUser(req)
    if (!session || (session.role !== 'teacher' && session.role !== 'platform_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { moduleId, title, content, videoUrl, duration, isPreview } = body

    if (!moduleId || !title || !content) {
      return NextResponse.json(
        { error: 'Module ID, title, and content are required' },
        { status: 400 }
      )
    }

    // Verify module belongs to teacher
    const moduleItem = await db.courseModule.findFirst({
      where: { id: moduleId, course: { organizationId: session.orgId || '' } },
    })
    if (!moduleItem) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    const lessonCount = await db.courseLesson.count({ where: { moduleId } })

    const lesson = await db.courseLesson.create({
      data: {
        title,
        content,
        videoUrl: videoUrl || null,
        videoDuration: parseInt(duration) || 0,
        isFree: isPreview || false,
        sortOrder: lessonCount,
        moduleId,
      },
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
    const session = await getAuthUser(req)
    if (!session || (session.role !== 'teacher' && session.role !== 'platform_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { lessonId, title, content, videoUrl, duration, isPreview, order } = body

    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 })
    }

    // Verify lesson belongs to teacher's course
    const lesson = await db.courseLesson.findFirst({
      where: { id: lessonId, module: { course: { organizationId: session.orgId || '' } } },
    })
    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl
    if (duration !== undefined) updateData.videoDuration = parseInt(duration) || 0
    if (isPreview !== undefined) updateData.isFree = isPreview
    if (order !== undefined) updateData.sortOrder = parseInt(order)

    const updated = await db.courseLesson.update({
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
    const session = await getAuthUser(req)
    if (!session || (session.role !== 'teacher' && session.role !== 'platform_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const lessonId = searchParams.get('lessonId')

    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 })
    }

    const lesson = await db.courseLesson.findFirst({
      where: { id: lessonId, module: { course: { organizationId: session.orgId || '' } } },
    })
    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    await db.courseLesson.delete({ where: { id: lessonId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete lesson error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

