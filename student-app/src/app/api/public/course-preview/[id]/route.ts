import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/public/course-preview/[id]
 * Returns course details with modules and lessons for public preview.
 * - All lessons are listed (title, type, duration, isFree) so students can see the curriculum.
 * - Only FREE lessons include videoUrl/fileUrl/content (so students can preview them).
 * - Non-free lessons have their content fields stripped (locked).
 * - Course must be published.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const course = await db.course.findFirst({
      where: {
        id,
        status: 'published',
      },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        demoVideo: true,
        price: true,
        mrp: true,
        category: true,
        language: true,
        level: true,
        featured: true,
        validityType: true,
        validityMonths: true,
        content: true,
        createdAt: true,
        modules: {
          select: {
            id: true,
            title: true,
            description: true,
            sortOrder: true,
            lessons: {
              select: {
                id: true,
                title: true,
                type: true,
                videoDuration: true,
                isFree: true,
                sortOrder: true,
                // Only include content/videoUrl/fileUrl for free lessons
                ...(true ? {} : {}), // placeholder — we'll filter below
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { purchasedBy: true } },
      },
    })

    if (!course) {
      return NextResponse.json({ success: false, message: 'Course not found' }, { status: 404 })
    }

    // Compute total lessons and total duration
    const allLessons = course.modules.flatMap(m => m.lessons)
    const totalLessons = allLessons.length
    const totalDuration = allLessons.reduce((sum, l) => sum + (l.videoDuration || 0), 0)
    const freeLessonCount = allLessons.filter(l => l.isFree).length

    // For free lessons, fetch the actual content (videoUrl, fileUrl, content, notes)
    const freeLessonIds = allLessons.filter(l => l.isFree).map(l => l.id)
    const freeLessonsWithContent = freeLessonIds.length > 0
      ? await db.courseLesson.findMany({
          where: { id: { in: freeLessonIds } },
          select: {
            id: true,
            content: true,
            videoUrl: true,
            fileUrl: true,
            notes: true,
          },
        })
      : []

    const freeContentMap = new Map(freeLessonsWithContent.map(l => [l.id, l]))

    // Build the response: all lessons listed, but only free ones have content
    const modulesWithLessons = course.modules.map(mod => ({
      ...mod,
      lessons: mod.lessons.map(lsn => {
        const base = {
          id: lsn.id,
          title: lsn.title,
          type: lsn.type,
          videoDuration: lsn.videoDuration,
          isFree: lsn.isFree,
          sortOrder: lsn.sortOrder,
        }
        if (lsn.isFree && freeContentMap.has(lsn.id)) {
          const content = freeContentMap.get(lsn.id)!
          return {
            ...base,
            content: content.content,
            videoUrl: content.videoUrl,
            fileUrl: content.fileUrl,
            notes: content.notes,
          }
        }
        // Locked lesson — no content
        return {
          ...base,
          content: null,
          videoUrl: null,
          fileUrl: null,
          notes: null,
        }
      }),
    }))

    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        demoVideo: course.demoVideo,
        price: course.price,
        mrp: course.mrp,
        category: course.category,
        language: course.language,
        level: course.level,
        featured: course.featured,
        validityType: course.validityType,
        validityMonths: course.validityMonths,
        content: course.content,
        createdAt: course.createdAt,
        enrollmentCount: course._count.purchasedBy,
        totalLessons,
        totalDuration,
        freeLessonCount,
        modules: modulesWithLessons,
      },
    })
  } catch (error) {
    console.error('Public course preview error:', error)
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 })
  }
}
