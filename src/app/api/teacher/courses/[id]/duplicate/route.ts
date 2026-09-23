export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'
import { getAuthUser } from '@/lib/auth-helpers'

/**
 * POST /api/teacher/courses/[id]/duplicate
 * Deep-copies a course with all its modules and lessons.
 * The new course gets a "(Copy)" suffix and 'draft' status.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'courses')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const auth = await getAuthUser(request)
    const { id } = await params

    // Cross-tenant guard
    const source = await db.course.findFirst({
      where: {
        id,
        ...(auth?.role !== 'platform_admin' && auth?.orgId ? { organizationId: auth.orgId } : {}),
      },
      include: {
        modules: {
          orderBy: { sortOrder: 'asc' },
          include: { lessons: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    })

    if (!source) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Use a transaction to ensure atomicity
    const newCourse = await db.$transaction(async (tx) => {
      // Create the new course
      const copy = await tx.course.create({
        data: {
          title: `${source.title} (Copy)`,
          description: source.description,
          content: source.content,
          thumbnail: source.thumbnail,
          demoVideo: source.demoVideo,
          price: source.price,
          mrp: source.mrp,
          category: source.category,
          language: source.language,
          level: source.level,
          featured: false, // Don't auto-feature duplicates
          status: 'draft', // Always start as draft
          organizationId: source.organizationId,
          validityType: source.validityType,
          validityMonths: source.validityMonths,
          validityEndDate: source.validityEndDate,
          discountCode: source.discountCode,
          sortOrder: source.sortOrder,
        },
      })

      // Copy all modules with their lessons
      for (const mod of source.modules) {
        const newModule = await tx.courseModule.create({
          data: {
            title: mod.title,
            description: mod.description,
            sortOrder: mod.sortOrder,
            courseId: copy.id,
          },
        })

        for (const lesson of mod.lessons) {
          await tx.courseLesson.create({
            data: {
              title: lesson.title,
              type: lesson.type,
              content: lesson.content,
              videoUrl: lesson.videoUrl,
              videoDuration: lesson.videoDuration,
              fileUrl: lesson.fileUrl,
              notes: lesson.notes,
              isFree: lesson.isFree,
              sortOrder: lesson.sortOrder,
              moduleId: newModule.id,
            },
          })
        }
      }

      return copy
    })

    return NextResponse.json({
      success: true,
      course: { id: newCourse.id, title: newCourse.title },
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to duplicate course:', error)
    return NextResponse.json({ error: 'Failed to duplicate course' }, { status: 500 })
  }
}

