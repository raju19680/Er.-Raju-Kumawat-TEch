export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'
import { getAuthUser } from '@/lib/auth-helpers'

const ALLOWED_LESSON_TYPES = ['video', 'pdf', 'text', 'link', 'live', 'image', 'audio', 'quiz', 'code', 'document', 'test', 'subjective', 'omr', 'youtube', 'webinar', 'folder', 'assignment']

/**
 * Verify that the caller owns the course (cross-tenant guard).
 * Returns true if accessible, false otherwise.
 */
async function ownsCourse(courseId: string, request: NextRequest): Promise<boolean> {
  const auth = await getAuthUser(request)
  if (!auth) return false
  if (auth.role === 'platform_admin') return true
  if (!auth.orgId) return false
  const course = await db.course.findFirst({
    where: { id: courseId, organizationId: auth.orgId },
    select: { id: true },
  })
  return !!course
}

/**
 * Verify that a module belongs to a course the caller owns.
 */
async function ownsModule(courseId: string, moduleId: string, request: NextRequest): Promise<boolean> {
  const auth = await getAuthUser(request)
  if (!auth) return false
  const found = await db.courseModule.findFirst({
    where: {
      id: moduleId,
      course: {
        id: courseId,
        ...(auth.role !== 'platform_admin' && auth.orgId ? { organizationId: auth.orgId } : {}),
      },
    },
    select: { id: true },
  })
  return !!found
}

// GET /api/teacher/courses/[id]/modules/lessons?moduleId=xxx
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await checkModuleAccess(req, 'courses')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id: courseId } = await params
    const { searchParams } = new URL(req.url)
    const moduleId = searchParams.get('moduleId')
    if (!moduleId) return NextResponse.json({ error: 'moduleId is required' }, { status: 400 })

    // Cross-tenant guard
    if (!(await ownsModule(courseId, moduleId, req))) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    const lessons = await db.courseLesson.findMany({
      where: { moduleId },
      include: { translations: true },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ success: true, lessons })
  } catch (error) {
    console.error('Get lessons error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/teacher/courses/[id]/modules/lessons?moduleId=xxx
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await checkModuleAccess(req, 'courses')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id: courseId } = await params
    const { searchParams } = new URL(req.url)
    const moduleId = searchParams.get('moduleId')
    if (!moduleId) return NextResponse.json({ error: 'moduleId is required' }, { status: 400 })

    // Cross-tenant guard
    if (!(await ownsModule(courseId, moduleId, req))) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    const body = await req.json()
    if (!body.title || !String(body.title).trim()) {
      return NextResponse.json({ error: 'Lesson title is required' }, { status: 400 })
    }

    // Validate lesson type
    const lessonType = body.type || 'video'
    if (!ALLOWED_LESSON_TYPES.includes(lessonType)) {
      return NextResponse.json({ error: `Invalid lesson type. Allowed: ${ALLOWED_LESSON_TYPES.join(', ')}` }, { status: 400 })
    }

    // Validate videoDuration is non-negative
    const videoDuration = typeof body.videoDuration === 'string'
      ? Math.max(0, parseInt(body.videoDuration) || 0)
      : Math.max(0, body.videoDuration || 0)

    // Use max(sortOrder)+1 to avoid collisions when lessons were deleted
    const maxSort = await db.courseLesson.findFirst({
      where: { moduleId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    const lesson = await db.courseLesson.create({
      data: {
        title: String(body.title).trim(),
        type: lessonType,
        content: body.content || null,
        videoUrl: body.videoUrl || null,
        videoDuration,
        fileUrl: body.fileUrl || null,
        notes: body.notes || null,
        isFree: body.isFree || false,
        allowPdfDownload: body.allowPdfDownload || false,
        securePdfWithPhone: body.securePdfWithPhone || false,
        isOptional: body.isOptional || false,
        sortOrder: body.sortOrder ?? (maxSort?.sortOrder ?? -1) + 1,
        moduleId,
      },
    })
    return NextResponse.json({ success: true, lesson }, { status: 201 })
  } catch (error) {
    console.error('Create lesson error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/teacher/courses/[id]/modules/lessons?moduleId=xxx
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await checkModuleAccess(req, 'courses')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id: courseId } = await params
    const { searchParams } = new URL(req.url)
    const moduleId = searchParams.get('moduleId')
    const body = await req.json()

    if (!body.lessonId) return NextResponse.json({ error: 'lessonId is required' }, { status: 400 })
    if (!moduleId) return NextResponse.json({ error: 'moduleId is required' }, { status: 400 })

    // Cross-tenant guard: verify lesson belongs to a module in a course the caller owns
    const auth = await getAuthUser(req)
    const existing = await db.courseLesson.findFirst({
      where: {
        id: body.lessonId,
        module: {
          id: moduleId,
          course: {
            id: courseId,
            ...(auth?.role !== 'platform_admin' && auth?.orgId ? { organizationId: auth.orgId } : {}),
          },
        },
      },
    })
    if (!existing) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

    // Validate type if provided
    if (body.type !== undefined && !ALLOWED_LESSON_TYPES.includes(body.type)) {
      return NextResponse.json({ error: `Invalid lesson type. Allowed: ${ALLOWED_LESSON_TYPES.join(', ')}` }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (body.title !== undefined) data.title = body.title
    if (body.type !== undefined) data.type = body.type
    if (body.content !== undefined) data.content = body.content
    if (body.videoUrl !== undefined) data.videoUrl = body.videoUrl
    if (body.videoDuration !== undefined) {
      data.videoDuration = typeof body.videoDuration === 'string'
        ? Math.max(0, parseInt(body.videoDuration) || 0)
        : Math.max(0, body.videoDuration || 0)
    }
    if (body.fileUrl !== undefined) data.fileUrl = body.fileUrl
    if (body.notes !== undefined) data.notes = body.notes
    if (body.isFree !== undefined) data.isFree = body.isFree
    if (body.allowPdfDownload !== undefined) data.allowPdfDownload = body.allowPdfDownload
    if (body.securePdfWithPhone !== undefined) data.securePdfWithPhone = body.securePdfWithPhone
    if (body.isOptional !== undefined) data.isOptional = body.isOptional
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder

    const lesson = await db.courseLesson.update({ where: { id: body.lessonId }, data })
    return NextResponse.json({ success: true, lesson })
  } catch (error) {
    console.error('Update lesson error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/teacher/courses/[id]/modules/lessons?moduleId=xxx&lessonId=xxx
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await checkModuleAccess(req, 'courses')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id: courseId } = await params
    const { searchParams } = new URL(req.url)
    const moduleId = searchParams.get('moduleId')
    const lessonId = searchParams.get('lessonId')

    if (!lessonId) return NextResponse.json({ error: 'lessonId is required' }, { status: 400 })
    if (!moduleId) return NextResponse.json({ error: 'moduleId is required' }, { status: 400 })

    // Cross-tenant guard
    const auth = await getAuthUser(req)
    const existing = await db.courseLesson.findFirst({
      where: {
        id: lessonId,
        module: {
          id: moduleId,
          course: {
            id: courseId,
            ...(auth?.role !== 'platform_admin' && auth?.orgId ? { organizationId: auth.orgId } : {}),
          },
        },
      },
      select: { id: true },
    })
    if (!existing) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

    // Cleanup lesson progress records first
    await db.lessonProgress.deleteMany({ where: { lessonId } })
    await db.courseLesson.delete({ where: { id: lessonId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete lesson error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

