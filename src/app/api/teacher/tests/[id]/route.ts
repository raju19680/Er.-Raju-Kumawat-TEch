export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrTeacher } from '@/lib/auth-helpers'
import { db as prisma } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminOrTeacher(request)
    if (authResult.error) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status })
    }
    const auth = authResult.user
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    if (!id) {
      return NextResponse.json({ success: false, error: 'Test ID is required' }, { status: 400 })
    }

    const data = await request.json()

    // Verify test belongs to a series in the current org
    const existingTest = await prisma.test.findUnique({
      where: { id },
      include: { testSeries: true }
    })

    if (!existingTest || (existingTest.organizationId !== auth.orgId && existingTest.testSeries?.organizationId !== auth.orgId)) {
      return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 })
    }

    const test = await prisma.test.update({
      where: { id },
      data: {
        title: data.title !== undefined ? data.title : undefined,
        status: data.status !== undefined ? data.status : undefined,
        isLive: data.isLive !== undefined ? Boolean(data.isLive) : undefined,
        isLocked: data.isLocked !== undefined ? Boolean(data.isLocked) : undefined,
        numberOfQuestions: data.numberOfQuestions !== undefined ? Number(data.numberOfQuestions) : undefined,
        totalMarks: data.totalMarks !== undefined ? Number(data.totalMarks) : undefined,
        totalDuration: data.totalDuration !== undefined ? Number(data.totalDuration) : undefined,
        sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : undefined,
        isPdfTest: data.isPdfTest !== undefined ? Boolean(data.isPdfTest) : undefined,
        pdfUrl: data.pdfUrl !== undefined ? data.pdfUrl : undefined,
        testMode: data.testMode !== undefined ? data.testMode : undefined,
        themeId: data.themeId !== undefined ? data.themeId : undefined,
        seoTitle: data.seoTitle !== undefined ? data.seoTitle : undefined,
        seoDescription: data.seoDescription !== undefined ? data.seoDescription : undefined,
        richSnippets: data.richSnippets !== undefined ? Boolean(data.richSnippets) : undefined,
        allowPdfDownload: data.allowPdfDownload !== undefined ? Boolean(data.allowPdfDownload) : undefined,
        allowPdfExport: data.allowPdfDownload !== undefined ? Boolean(data.allowPdfDownload) : undefined,
        pdfPasswordProtected: data.pdfPasswordProtected !== undefined ? Boolean(data.pdfPasswordProtected) : undefined,
        negativeMarks: data.negativeMarks !== undefined ? Number(data.negativeMarks) : undefined,
        sectionWiseMarks: data.sectionWiseMarks !== undefined ? Boolean(data.sectionWiseMarks) : undefined,
        partialScoring: data.partialScoring !== undefined ? Boolean(data.partialScoring) : undefined,
        maxAttempts: data.maxAttempts !== undefined ? Number(data.maxAttempts) : undefined,
        shuffleQuestions: data.shuffleQuestions !== undefined ? Boolean(data.shuffleQuestions) : undefined,
        shuffleOptions: data.shuffleOptions !== undefined ? Boolean(data.shuffleOptions) : undefined,
        displayPause: data.displayPause !== undefined ? Boolean(data.displayPause) : undefined,
        allCompulsory: data.allCompulsory !== undefined ? Boolean(data.allCompulsory) : undefined,
        displayResults: data.displayResults !== undefined ? Boolean(data.displayResults) : undefined,
        displayRank: data.displayRank !== undefined ? Boolean(data.displayRank) : undefined,
        showSolution: data.showSolution !== undefined ? Boolean(data.showSolution) : undefined,
        showPercentile: data.showPercentile !== undefined ? Boolean(data.showPercentile) : undefined,
        showTotalStudents: data.showTotalStudents !== undefined ? Boolean(data.showTotalStudents) : undefined,
        instructions: data.instructions !== undefined ? data.instructions : undefined,
      }
    })

    return NextResponse.json({ success: true, test })
  } catch (error) {
    console.error('Error updating test:', error)
    return NextResponse.json({ success: false, error: 'Failed to update test' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminOrTeacher(request)
    if (authResult.error) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status })
    }
    const auth = authResult.user
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    if (!id) {
      return NextResponse.json({ success: false, error: 'Test ID is required' }, { status: 400 })
    }

    // Verify test belongs to a series in the current org
    const existingTest = await prisma.test.findUnique({
      where: { id },
      include: { testSeries: true }
    })

    if (!existingTest || (existingTest.organizationId !== auth.orgId && existingTest.testSeries?.organizationId !== auth.orgId)) {
      return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 })
    }

    await prisma.test.delete({
      where: { id }
    })

    // Decrement testCount
    if (existingTest.testSeriesId) {
      await prisma.testSeries.update({
        where: { id: existingTest.testSeriesId },
        data: {
          // testCount: { decrement: 1 }
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting test:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete test' }, { status: 500 })
  }
}



