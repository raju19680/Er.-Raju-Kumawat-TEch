import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    const normalizedRole = String(auth.role).toLowerCase()
    const isStudent = normalizedRole === 'student'
    const isTeacher = ['teacher', 'org_admin', 'admin', 'platform_admin'].includes(normalizedRole)
    if (!isStudent && !isTeacher) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    const { id } = await params

    const student = await db.student.findFirst({
      where: { userId: auth.id },
    })
    if (!student && auth.role === 'student') {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 })
    }
    const studentId = student?.id || 'admin-bypass'

    const attempt = await db.testAttempt.findFirst({
      where: { id, studentId },
      select: {
        id: true,
        testId: true,
        score: true,
        totalMarks: true,
        rank: true,
        percentile: true,
        timeTaken: true,
        status: true,
        answers: true,
        startedAt: true,
        completedAt: true,
        omrImageUrl: true,
        timePerQuestion: true,
        themeSnapshot: true,
        test: {
          select: {
            id: true,
            title: true,
            testMode: true,
            totalDuration: true,
            numberOfQuestions: true,
            totalMarks: true,
            negativeMarks: true,
            showSolution: true,
            displayResults: true,
            displayRank: true,
            showPercentile: true,
            questions: {
              select: {
                id: true,
                type: true,
                title: true,
                image1: true,
                image2: true,
                image3: true,
                option1: true,
                option2: true,
                option3: true,
                option4: true,
                option5: true,
                option1Image: true,
                option2Image: true,
                option3Image: true,
                option4Image: true,
                option5Image: true,
                correctOption: true,
                solutionHeading: true,
                solutionImage1: true,
                solutionImage2: true,
                solutionVideo: true,
                solutionText: true,
                positiveMarks: true,
                negativeMarks: true,
                section: true,
              },
              orderBy: { sortOrder: 'asc' },
            },
            testSeries: {
              select: { id: true, title: true },
            },
          },
        },
      },
    })

    if (!attempt) {
      return NextResponse.json({ success: false, message: 'Attempt not found' }, { status: 404 })
    }

    // Parse answers
    const answers = attempt.answers ? JSON.parse(attempt.answers as string) : {}
    let timePerQuestion: Record<string, number> = {}
    try {
      if (attempt.timePerQuestion) {
        timePerQuestion = JSON.parse(attempt.timePerQuestion as string)
      }
    } catch {}

    // Build question review
    const questionReview = attempt.test.questions.map((q) => {
      const selectedOption = answers[q.id] || null
      const correctOptions = q.correctOption ? q.correctOption.split(',').map((s: string) => s.trim()) : []
      const isCorrect = selectedOption && correctOptions.includes(selectedOption)
      const isAttempted = selectedOption !== null && selectedOption !== undefined && selectedOption !== ''

      let marksObtained = 0
      if (isCorrect) {
        marksObtained = q.positiveMarks
      } else if (isAttempted) {
        marksObtained = -Math.abs(q.negativeMarks)
      }

      return {
        id: q.id,
        type: q.type,
        title: q.title,
        image1: q.image1,
        image2: q.image2,
        image3: q.image3,
        option1: q.option1,
        option2: q.option2,
        option3: q.option3,
        option4: q.option4,
        option5: q.option5,
        option1Image: q.option1Image,
        option2Image: q.option2Image,
        option3Image: q.option3Image,
        option4Image: q.option4Image,
        option5Image: q.option5Image,
        solutionImage1: q.solutionImage1,
        solutionImage2: q.solutionImage2,
        correctOption: attempt.test.showSolution ? q.correctOption : null,
        selectedOption,
        isCorrect,
        isAttempted,
        marksObtained,
        positiveMarks: q.positiveMarks,
        negativeMarks: q.negativeMarks,
        section: q.section,
        timeTaken: timePerQuestion[q.id] || 0,
        solution: attempt.test.showSolution ? {
          heading: q.solutionHeading,
          image1: q.solutionImage1,
          image2: q.solutionImage2,
          video: q.solutionVideo,
          text: q.solutionText,
        } : null,
      }
    })

    // Calculate total students who attempted this test (for rank percentile)
    const totalAttempted = await db.testAttempt.count({
      where: { testId: attempt.testId, status: 'completed' },
    })

    return NextResponse.json({
      success: true,
      attempt: {
        id: attempt.id,
        testId: attempt.testId,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        rank: attempt.test.displayRank ? attempt.rank : null,
        percentile: attempt.test.showPercentile ? attempt.percentile : null,
        timeTaken: attempt.timeTaken,
        status: attempt.status,
        omrImageUrl: attempt.omrImageUrl,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
        totalStudents: attempt.test.displayRank ? totalAttempted : null,
        test: {
          id: attempt.test.id,
          title: attempt.test.title,
          testMode: attempt.test.testMode,
          totalDuration: attempt.test.totalDuration,
          numberOfQuestions: attempt.test.numberOfQuestions,
          showSolution: attempt.test.showSolution,
          displayResults: attempt.test.displayResults,
          testSeries: attempt.test.testSeries,
        },
        questionReview,
      },
    })
  } catch (error) {
    console.error('Student test-attempt detail error:', error)
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    const normalizedRole = String(auth.role).toLowerCase()
    const isStudent = normalizedRole === 'student'
    const isTeacher = ['teacher', 'org_admin', 'admin', 'platform_admin'].includes(normalizedRole)
    if (!isStudent && !isTeacher) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    const { id } = await params

    const student = await db.student.findFirst({
      where: { userId: auth.id },
    })
    if (!student && auth.role === 'student') {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 })
    }
    const studentId = student?.id || 'admin-bypass'

    const { answers, timeTaken, omrImageUrl, markedForReview, timePerQuestion } = await req.json()

    const attempt = await db.testAttempt.findFirst({
      where: { id, studentId, status: 'in_progress' },
      include: { test: { select: { testMode: true } } }
    })

    if (!attempt) {
      return NextResponse.json({ success: false, message: 'No in-progress attempt found' }, { status: 404 })
    }

    const isOmr = attempt.test.testMode === 'OMR' || !!omrImageUrl

    if (isOmr) {
      const updated = await db.testAttempt.update({
        where: { id },
        data: {
          answers: omrImageUrl ? JSON.stringify({ omrImageUrl }) : '{}',
          omrImageUrl: omrImageUrl || attempt.omrImageUrl,
          timeTaken: timeTaken || 0,
          status: 'submitted',
          completedAt: new Date(),
        },
      })
      return NextResponse.json({ success: true, attempt: updated })
    }

    // Process digital test
    const questions = await db.question.findMany({
      where: { testId: attempt.testId },
      select: {
        id: true,
        correctOption: true,
        positiveMarks: true,
        negativeMarks: true,
        type: true,
      },
    })

    // Calculate score
    let score = 0
    const answersMap = answers?.answers || answers || {}

    for (const q of questions) {
      const selectedOption = answersMap[q.id]
      if (!selectedOption) continue

      const correctOptions = q.correctOption ? q.correctOption.split(',').map((s: string) => s.trim()) : []

      if (correctOptions.includes(selectedOption)) {
        score += q.positiveMarks
      } else {
        score -= Math.abs(q.negativeMarks)
      }
    }

    score = Math.max(0, score)

    const finalPayload = {
      answers: answersMap,
      markedForReview: markedForReview || [],
      timePerQuestion: timePerQuestion || {}
    }

    // Update attempt
    const updated = await db.testAttempt.update({
      where: { id },
      data: {
        answers: JSON.stringify(finalPayload),
        score,
        timeTaken: timeTaken || 0,
        status: 'completed',
        completedAt: new Date(),
      },
    })

    // Calculate rank only if it's NOT a practice attempt
    if (!updated.isPractice) {
      const higherScores = await db.testAttempt.count({
        where: {
          testId: attempt.testId,
          status: 'completed',
          isPractice: false,
          score: { gt: score },
        },
      })

      const rank = higherScores + 1

      // Calculate percentile
      const totalRanked = await db.testAttempt.count({
        where: {
          testId: attempt.testId,
          status: 'completed',
          isPractice: false
        },
      })

      const percentile = totalRanked > 1 ? ((totalRanked - rank) / (totalRanked - 1)) * 100 : 100

      await db.testAttempt.update({
        where: { id },
        data: { rank, percentile },
      })
    }

    return NextResponse.json({
      success: true,
      attempt: {
        id: updated.id,
        score,
        totalMarks: updated.totalMarks,
        rank: updated.rank,
        percentile: updated.percentile,
        timeTaken: updated.timeTaken,
        status: updated.status,
      },
    })
  } catch (error) {
    console.error('Student test-attempt submit error:', error)
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 })
  }
}
