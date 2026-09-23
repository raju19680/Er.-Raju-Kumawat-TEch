export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(req, 'courses')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id: courseId } = await params

    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: { select: { id: true, videoDuration: true } }
          }
        }
      }
    })

    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    const allLessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id))
    const totalLessons = allLessonIds.length

    const purchases = await db.purchasedCourse.findMany({
      where: { courseId },
      include: {
        student: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    })

    const studentProgress = await db.lessonProgress.findMany({
      where: { courseId }
    })

    const progressByStudent = studentProgress.reduce((acc, curr) => {
      if (!acc[curr.studentId]) acc[curr.studentId] = []
      acc[curr.studentId].push(curr)
      return acc
    }, {} as Record<string, any[]>)

    const analytics = purchases.map(p => {
      const studentId = p.student.id
      const sp = progressByStudent[studentId] || []
      const completed = sp.filter(s => s.status === 'completed').length
      const progressPercent = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0
      
      let lastActive = p.purchasedAt
      if (sp.length > 0) {
        const sorted = [...sp].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        lastActive = sorted[0].updatedAt
      }

      return {
        studentId: p.student.id,
        studentName: p.student.name,
        studentEmail: p.student.email,
        studentPhone: p.student.phone,
        enrolledAt: p.purchasedAt,
        completedLessons: completed,
        totalLessons,
        progressPercent,
        lastActive
      }
    })

    // General Stats
    const totalRevenue = purchases.length * course.price
    const avgProgress = analytics.length > 0 ? analytics.reduce((s, a) => s + a.progressPercent, 0) / analytics.length : 0

    return NextResponse.json({ 
      success: true, 
      analytics, 
      overview: {
        totalEnrolled: purchases.length,
        avgProgress: Math.round(avgProgress),
        totalRevenue
      } 
    })
  } catch (error) {
    console.error('Fetch analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

