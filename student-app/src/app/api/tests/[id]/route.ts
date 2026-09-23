import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const test = await db.test.findUnique({
      where: { id },
    })

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, test })
  } catch (error) {
    console.error('Failed to fetch test:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'tests')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Verify test exists
    const existing = await db.test.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      )
    }

    // Resolve orgCode to orgId if organizationId is provided
    let orgId = existing.organizationId
    if (body.organizationId) {
      if (body.organizationId.length < 20) {
        const org = await db.organization.findUnique({
          where: { code: body.organizationId },
          select: { id: true },
        })
        orgId = org?.id || body.organizationId
      } else {
        orgId = body.organizationId
      }
    }

    const test = await db.test.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.instructions !== undefined && { instructions: body.instructions || null }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.isLive !== undefined && { isLive: body.isLive }),
        ...(body.isLocked !== undefined && { isLocked: body.isLocked }),
        ...(body.numberOfQuestions !== undefined && { numberOfQuestions: body.numberOfQuestions }),
        ...(body.totalMarks !== undefined && { totalMarks: body.totalMarks }),
        ...(body.totalDuration !== undefined && { totalDuration: body.totalDuration }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        ...(body.sectionWiseMarks !== undefined && { sectionWiseMarks: body.sectionWiseMarks }),
        ...(body.negativeMarks !== undefined && { negativeMarks: body.negativeMarks }),
        ...(body.startDate !== undefined && { startDate: body.startDate ? new Date(body.startDate) : null }),
        ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
        ...(body.language !== undefined && { language: body.language }),
        ...(body.translationTitle !== undefined && { translationTitle: body.translationTitle || null }),
        ...(body.maxAttempts !== undefined && { maxAttempts: body.maxAttempts }),
        ...(body.shuffleQuestions !== undefined && { shuffleQuestions: body.shuffleQuestions }),
        ...(body.shuffleOptions !== undefined && { shuffleOptions: body.shuffleOptions }),
        ...(body.displayPause !== undefined && { displayPause: body.displayPause }),
        ...(body.allCompulsory !== undefined && { allCompulsory: body.allCompulsory }),
        ...(body.uiType !== undefined && { uiType: body.uiType }),
        ...(body.attachPdf !== undefined && { attachPdf: body.attachPdf || null }),
        ...(body.allowPdfExport !== undefined && { allowPdfExport: body.allowPdfExport }),
        ...(body.partialScoring !== undefined && { partialScoring: body.partialScoring }),
        ...(body.displayResults !== undefined && { displayResults: body.displayResults }),
        ...(body.displayRank !== undefined && { displayRank: body.displayRank }),
        ...(body.showSolution !== undefined && { showSolution: body.showSolution }),
        ...(body.showTotalStudents !== undefined && { showTotalStudents: body.showTotalStudents }),
        ...(body.showPercentile !== undefined && { showPercentile: body.showPercentile }),
        ...(body.solutionLink !== undefined && { solutionLink: body.solutionLink || null }),
        ...(body.telegramSettings !== undefined && { telegramSettings: body.telegramSettings || null }),
        ...(body.testSeriesId !== undefined && { testSeriesId: body.testSeriesId }),
        ...(body.organizationId && { organizationId: orgId }),
      },
    })

    return NextResponse.json({ success: true, test })
  } catch (error) {
    console.error('Failed to update test:', error)
    return NextResponse.json(
      { error: 'Failed to update test' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'tests')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params

    // Verify test exists
    const existing = await db.test.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      )
    }

    await db.test.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Test deleted' })
  } catch (error) {
    console.error('Failed to delete test:', error)
    return NextResponse.json(
      { error: 'Failed to delete test' },
      { status: 500 }
    )
  }
}
