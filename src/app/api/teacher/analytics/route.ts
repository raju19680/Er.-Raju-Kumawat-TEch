export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminOrTeacher } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdminOrTeacher(req)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }
    const auth = authResult.user
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const organizationId = auth.orgId;
    if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    // 1. Overall Test Performance
    const allCompletedAttempts = await db.testAttempt.findMany({
      where: { 
        test: { organizationId },
        status: 'completed',
        totalMarks: { gt: 0 }
      },
      select: { score: true, totalMarks: true, studentId: true }
    })

    let totalAvgScore = 0
    const studentScoreMap = new Map<string, { totalPercent: number, count: number }>()

    if (allCompletedAttempts.length > 0) {
      const sumPercent = allCompletedAttempts.reduce((sum, a) => sum + (a.score / a.totalMarks) * 100, 0)
      totalAvgScore = Math.round(sumPercent / allCompletedAttempts.length)

      // Map scores per student to find at-risk students
      allCompletedAttempts.forEach(a => {
        const percent = (a.score / a.totalMarks) * 100
        const existing = studentScoreMap.get(a.studentId) || { totalPercent: 0, count: 0 }
        studentScoreMap.set(a.studentId, {
          totalPercent: existing.totalPercent + percent,
          count: existing.count + 1
        })
      })
    }

    // Identify At-Risk Students (Average score < 40%)
    const atRiskStudentIds: string[] = []
    studentScoreMap.forEach((data, studentId) => {
      const avg = data.totalPercent / data.count
      if (avg < 40) atRiskStudentIds.push(studentId)
    })

    const atRiskStudents = await db.student.findMany({
      where: { id: { in: atRiskStudentIds } },
      select: { id: true, name: true, email: true, phone: true }
    })

    const formattedAtRisk = atRiskStudents.map(s => {
      const stats = studentScoreMap.get(s.id)
      return {
        ...s,
        avgScore: stats ? Math.round(stats.totalPercent / stats.count) : 0
      }
    }).sort((a, b) => a.avgScore - b.avgScore).slice(0, 10) // Top 10 most at-risk

    // 2. Course Completion Rates
    const activeCourses = await db.course.findMany({
      where: { organizationId, status: 'published' },
      select: {
        id: true,
        title: true,
        _count: { select: { purchasedBy: true } },
        modules: {
          select: {
            lessons: { select: { id: true } }
          }
        }
      }
    })

    const courseCompletionStats = await Promise.all(activeCourses.map(async (course) => {
      const totalEnrollments = course._count.purchasedBy
      if (totalEnrollments === 0) return { title: course.title, completionRate: 0, enrollments: 0 }

      const allLessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id))
      const totalLessons = allLessonIds.length
      if (totalLessons === 0) return { title: course.title, completionRate: 0, enrollments: totalEnrollments }

      // Get progress for these lessons
      const progress = await db.lessonProgress.findMany({
        where: { lessonId: { in: allLessonIds }, status: 'completed' }
      })

      // Group by student
      const studentProgressMap = new Map<string, number>()
      progress.forEach(p => {
        studentProgressMap.set(p.studentId, (studentProgressMap.get(p.studentId) || 0) + 1)
      })

      // Count students who have completed 100%
      let completelyFinishedStudents = 0
      studentProgressMap.forEach((completedCount) => {
        if (completedCount >= totalLessons) completelyFinishedStudents++
      })

      const completionRate = Math.round((completelyFinishedStudents / totalEnrollments) * 100)

      return {
        title: course.title,
        completionRate,
        enrollments: totalEnrollments,
        completedBy: completelyFinishedStudents
      }
    }))

    return NextResponse.json({
      success: true,
      data: {
        macroStats: {
          averageTestScorePercent: totalAvgScore,
          totalTestsTaken: allCompletedAttempts.length,
          atRiskStudentsCount: atRiskStudentIds.length
        },
        atRiskStudents: formattedAtRisk,
        courseCompletionStats
      }
    })
  } catch (error) {
    console.error('Teacher analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

