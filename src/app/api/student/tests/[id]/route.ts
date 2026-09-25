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

    let orgId = auth.orgId
    let studentId = ''

    if (isStudent) {
      const student = await db.student.findFirst({
        where: { userId: auth.id },
      })
      if (!student) {
        return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 })
      }
      orgId = student.organizationId
      studentId = student.id
    }

    // Check for in-progress attempt first
    const inProgressAttempt = studentId ? await db.testAttempt.findFirst({
      where: { studentId, testId: id, status: 'in_progress' },
    }) : null

    // Get test with questions
    const test = await db.test.findFirst({
      where: { id, organizationId: orgId },
      select: {
        id: true,
        title: true,
        instructions: true,
        totalDuration: true,
        numberOfQuestions: true,
        totalMarks: true,
        testMode: true,
        isPdfTest: true,
        pdfUrl: true,
        attachPdf: true,
        isLive: true,
        isLocked: true,
        maxAttempts: true,
        negativeMarks: true,
        shuffleQuestions: true,
        shuffleOptions: true,
        showSolution: true,
        displayResults: true,
        displayRank: true,
        showPercentile: true,
        partialScoring: true,
        sectionWiseMarks: true,
        allCompulsory: true,
        testSeriesId: true,
        questions: {
          select: {
            id: true,
            type: true,
            heading: true,
            directive: true,
            title: true,
            titleHi: true,
            image1: true,
            image2: true,
            image3: true,
            option1: true,
            option2: true,
            option3: true,
            option4: true,
            option5: true,
            option1Hi: true,
            option2Hi: true,
            option3Hi: true,
            option4Hi: true,
            option5Hi: true,
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
            solutionTextHi: true,
            section: true,
            positiveMarks: true,
            negativeMarks: true,
            partialMarks: true,
            sortOrder: true,
            passageId: true,
            passage: {
              select: {
                id: true,
                text: true,
                /* textHi removed */
                image: true
              }
            }
          },
          orderBy: { sortOrder: 'asc' },
        },
        
      },
    })

    if (!test) {
      return NextResponse.json({ success: false, message: 'Test not found' }, { status: 404 })
    }

    // Check if student has an in-progress attempt
    const hasInProgress = !!inProgressAttempt

    // If there's an in-progress attempt, don't show correct options
    // If test is completed and showSolution is true, show solutions
    // SECURITY: Only show correct options if there's NO in-progress attempt
    // AND test.showSolution is true AND there's at least one completed attempt
    const completedAttemptsCount = studentId ? await db.testAttempt.count({ where: { studentId, testId: id, status: 'completed' } }) : 0
    const hasCompletedAttempt = completedAttemptsCount > 0
    const hideCorrectOptions = hasInProgress || !test.showSolution || !hasCompletedAttempt

    const formattedQuestions = test.questions.map((q) => {
      const base = {
        id: q.id,
        type: q.type,
        heading: q.heading,
        directive: q.directive,
        title: q.title,
        titleHi: q.titleHi,
        image1: q.image1,
        image2: q.image2,
        image3: q.image3,
        option1: q.option1,
        option2: q.option2,
        option3: q.option3,
        option4: q.option4,
        option5: q.option5,
        option1Hi: q.option1Hi,
        option2Hi: q.option2Hi,
        option3Hi: q.option3Hi,
        option4Hi: q.option4Hi,
        option5Hi: q.option5Hi,
        option1Image: q.option1Image,
        option2Image: q.option2Image,
        option3Image: q.option3Image,
        option4Image: q.option4Image,
        option5Image: q.option5Image,
        section: q.section,
        positiveMarks: q.positiveMarks,
        negativeMarks: q.negativeMarks,
        partialMarks: q.partialMarks,
        sortOrder: q.sortOrder,
        passageId: q.passageId,
        passage: q.passage,
      }

      if (hideCorrectOptions && hasInProgress) {
        // During test: hide correct options and solutions
        return base
      }

      // After test with showSolution: show everything
      return {
        ...base,
        correctOption: q.correctOption,
        solutionHeading: q.solutionHeading,
        solutionImage1: q.solutionImage1,
        solutionImage2: q.solutionImage2,
        solutionVideo: q.solutionVideo,
        solutionText: q.solutionText,
        solutionTextHi: q.solutionTextHi,
      }
    })

    return NextResponse.json({
      success: true,
      test: {
        id: test.id,
        title: test.title,
        instructions: test.instructions,
        totalDuration: test.totalDuration,
        numberOfQuestions: test.numberOfQuestions,
        totalMarks: test.totalMarks,
        testMode: test.testMode || 'CBT',
        attachPdf: test.attachPdf,
        isLive: test.isLive,
        isLocked: test.isLocked,
        maxAttempts: test.maxAttempts,
        negativeMarks: test.negativeMarks,
        shuffleQuestions: test.shuffleQuestions,
        shuffleOptions: test.shuffleOptions,
        showSolution: test.showSolution,
        displayResults: test.displayResults,
        displayRank: test.displayRank,
        showPercentile: test.showPercentile,
        partialScoring: test.partialScoring,
        sectionWiseMarks: test.sectionWiseMarks,
        allCompulsory: test.allCompulsory,
        testSeriesId: test.testSeriesId,
        completedAttempts: completedAttemptsCount,
        hasInProgress,
        inProgressAttemptId: inProgressAttempt?.id || null,
          inProgressAnswers: inProgressAttempt?.answers ? JSON.parse(inProgressAttempt.answers) : {},
          inProgressTimeTaken: inProgressAttempt?.timeTaken || 0,
        questions: formattedQuestions,
      },
    })
  } catch (error) {
    console.error('Student test detail error:', error)
    return NextResponse.json({ success: false, message: (error as any).message || 'Something went wrong', stack: (error as any).stack }, { status: 500 })
  }
}



