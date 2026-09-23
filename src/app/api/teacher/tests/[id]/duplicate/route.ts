import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminOrTeacher } from '@/lib/auth-helpers'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminOrTeacher(req)
    if (authResult.error) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status })
    }
    const auth = authResult.user
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const test = await db.test.findUnique({
      where: {
        id,
        organizationId: auth.orgId || ''
      },
      include: {
        questions: true
      }
    })

    if (!test) {
      return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 })
    }

    // Determine new sort order (append to end if part of series)
    let newSortOrder = test.sortOrder
    if (test.testSeriesId) {
      const existingTests = await db.test.count({
        where: { testSeriesId: test.testSeriesId }
      })
      newSortOrder = existingTests
    }

    // Clone the test
    const newTest = await db.test.create({
      data: {
        title: `${test.title} (Copy)`,
        status: test.status,
        isLive: false,
        isLocked: test.isLocked,
        numberOfQuestions: test.numberOfQuestions,
        totalMarks: test.totalMarks,
        totalDuration: test.totalDuration,
        isPdfTest: test.isPdfTest,
        pdfUrl: test.pdfUrl,
        testMode: test.testMode,
        allowPdfDownload: test.allowPdfDownload,
        allowPdfExport: test.allowPdfExport,
        pdfPasswordProtected: test.pdfPasswordProtected,
        negativeMarks: test.negativeMarks,
        sectionWiseMarks: test.sectionWiseMarks,
        partialScoring: test.partialScoring,
        maxAttempts: test.maxAttempts,
        shuffleQuestions: test.shuffleQuestions,
        shuffleOptions: test.shuffleOptions,
        displayPause: test.displayPause,
        allCompulsory: test.allCompulsory,
        displayResults: test.displayResults,
        displayRank: test.displayRank,
        showSolution: test.showSolution,
        showPercentile: test.showPercentile,
        showTotalStudents: test.showTotalStudents,
        instructions: test.instructions,
        testSeriesId: test.testSeriesId,
        organizationId: test.organizationId,
        sortOrder: newSortOrder,
        themeId: test.themeId,
        seoTitle: test.seoTitle,
        seoDescription: test.seoDescription,
        richSnippets: test.richSnippets
      }
    })

    // Clone test questions
    if (test.questions && test.questions.length > 0) {
      const questionLinks = test.questions.map(tq => ({
        testId: newTest.id,
        questionId: tq.questionId,
        marks: tq.marks,
        negativeMarks: tq.negativeMarks,
        order: tq.order,
        sortOrder: tq.sortOrder,
        section: tq.section
      }))
      
      await db.testQuestion.createMany({
        data: questionLinks
      })
    }

    return NextResponse.json({ success: true, test: newTest })
  } catch (error) {
    console.error('Error duplicating test:', error)
    return NextResponse.json({ success: false, error: 'Failed to duplicate test' }, { status: 500 })
  }
}
