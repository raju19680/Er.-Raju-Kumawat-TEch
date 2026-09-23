import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const { id: testId } = await params

    // Fetch top 10 ranked attempts
    const attempts = await db.testAttempt.findMany({
      where: {
        testId,
        status: 'completed',
        isPractice: false,
      },
      select: {
        id: true,
        score: true,
        timeTaken: true,
        student: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        }
      },
      orderBy: [
        { score: 'desc' },
        { timeTaken: 'asc' } // Tie breaker
      ],
      take: 10,
    })

    // Assign rank 1..10 to the sorted array
    const leaderboard = attempts.map((a, i) => ({
      rank: i + 1,
      studentName: a.student.name || 'Anonymous Student',
      avatar: a.student.avatar,
      score: a.score,
      timeTaken: a.timeTaken,
    }))

    // Get current student's rank
    const currentStudentAttempt = await db.testAttempt.findFirst({
      where: {
        testId,
        studentId: student.id,
        status: 'completed',
        isPractice: false,
      },
      select: {
        score: true,
        timeTaken: true,
        rank: true,
      },
      orderBy: {
        score: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      leaderboard,
      myRank: currentStudentAttempt ? currentStudentAttempt.rank : null,
      myScore: currentStudentAttempt ? currentStudentAttempt.score : null,
    })

  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 })
  }
}
