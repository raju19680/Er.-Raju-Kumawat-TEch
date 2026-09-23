import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    // 1. Fetch Enrolled Courses with Progress
    const purchasedCourses = await db.purchasedCourse.findMany({
      where: { studentId: student.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            _count: {
              select: { modules: true }
            },
            modules: {
              select: {
                lessons: {
                  select: { id: true }
                }
              }
            }
          }
        }
      }
    })

    // Calculate progress for each course
    const allLessonIdsInCourses = purchasedCourses.flatMap(pc => 
      pc.course.modules.flatMap(m => m.lessons.map(l => l.id))
    )

    const lessonProgress = await db.lessonProgress.findMany({
      where: {
        studentId: student.id,
        lessonId: { in: allLessonIdsInCourses },
        status: 'completed'
      }
    })

    const completedLessonIds = new Set(lessonProgress.map(lp => lp.lessonId))

    const activeCourses = purchasedCourses.map(pc => {
      const allLessons = pc.course.modules.flatMap(m => m.lessons)
      const totalLessons = allLessons.length
      const completed = allLessons.filter(l => completedLessonIds.has(l.id)).length
      const progressPercent = totalLessons === 0 ? 0 : Math.round((completed / totalLessons) * 100)

      return {
        id: pc.course.id,
        title: pc.course.title,
        thumbnail: pc.course.thumbnail,
        progressPercent,
        completedLessons: completed,
        totalLessons
      }
    })

    // 2. Fetch Recent Test Scores
    const recentTests = await db.testAttempt.findMany({
      where: { studentId: student.id, status: 'completed' },
      take: 5,
      orderBy: { completedAt: 'desc' },
      include: {
        test: {
          select: { title: true, totalMarks: true }
        }
      }
    })

    const performanceTrends = recentTests.map(t => ({
      testName: t.test.title,
      score: t.score,
      totalMarks: t.totalMarks,
      percent: t.totalMarks > 0 ? Math.round((t.score / t.totalMarks) * 100) : 0,
      date: t.completedAt
    }))

    // 3. Recommended Next Steps
    // Find the first active course that is not 100% complete
    let recommendedStep: any = null
    const ongoingCourse = activeCourses.find(c => c.progressPercent < 100 && c.progressPercent > 0)
    if (ongoingCourse) {
      recommendedStep = {
        type: 'continue_course',
        title: `Continue learning: ${ongoingCourse.title}`,
        link: `/student/courses/${ongoingCourse.id}`
      }
    } else if (activeCourses.length > 0) {
      recommendedStep = {
        type: 'start_course',
        title: `Start learning: ${activeCourses[0].title}`,
        link: `/student/courses/${activeCourses[0].id}`
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        activeCourses,
        performanceTrends,
        recommendedStep,
        upcomingDeadlines: [] // Placeholder for Phase 3 Assignments
      }
    })
  } catch (error) {
    console.error('Student dashboard error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
