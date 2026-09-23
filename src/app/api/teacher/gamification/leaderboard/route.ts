export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthTeacher } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const { auth, teacher, error } = await getAuthTeacher(req)
    if (error || !teacher || !auth) return NextResponse.json({ success: false, message: error }, { status: 401 })

    // Aggregate marks obtained by all students
    const submissions = await db.assignmentSubmission.groupBy({
      by: ['studentId'],
      _sum: {
        marksObtained: true
      },
      where: {
        status: 'graded',
        marksObtained: { not: null }
      }
    })

    // Get student details for those IDs
    const studentIds = submissions.map(s => s.studentId)
    const studentsData = await db.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, name: true, email: true }
    })

    // Combine and sort
    const leaderboard = submissions.map(sub => {
      const stu = studentsData.find(s => s.id === sub.studentId)
      return {
        id: sub.studentId,
        name: stu?.name || stu?.email?.split('@')[0] || 'Unknown',
        points: sub._sum.marksObtained || 0
      }
    }).sort((a, b) => b.points - a.points)

    // Limit to top 10
    const top10 = leaderboard.slice(0, 10)

    return NextResponse.json({ success: true, data: top10 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}

