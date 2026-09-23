export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrTeacher } from '@/lib/auth-helpers'
import { db as prisma } from '@/lib/db'

export async function GET(
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
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    if (!id) {
      return NextResponse.json({ success: false, error: 'Test Series ID is required' }, { status: 400 })
    }

    const testSeries = await prisma.testSeries.findFirst({
      where: { id, organizationId: auth.orgId || '' }
    })

    if (!testSeries) {
      return NextResponse.json({ success: false, error: 'Test Series not found' }, { status: 404 })
    }

    const tests = await prisma.test.findMany({
      where: { testSeriesId: id },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({ success: true, tests })
  } catch (error) {
    console.error('Error fetching test series tests:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch tests' }, { status: 500 })
  }
}

export async function POST(
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
      return NextResponse.json({ success: false, error: 'Test Series ID is required' }, { status: 400 })
    }

    const data = await request.json()
    const { 
      title, 
      status = 'free', 
      sortOrder = 0, 
      isLive, 
      isLocked, 
      numberOfQuestions, 
      totalMarks, 
      totalDuration, 
      isPdfTest, 
      pdfUrl,
      testMode = 'CBT',
      allowPdfDownload = false,
      pdfPasswordProtected = false,
      negativeMarks = 0,
      sectionWiseMarks = false,
      partialScoring = false,
      maxAttempts = 1,
      shuffleQuestions = false,
      shuffleOptions = false,
      displayPause = false,
      allCompulsory = true,
      displayResults = true,
      displayRank = true,
      showSolution = true,
      showPercentile = false,
      showTotalStudents = false,
      instructions = ''
    } = data

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }

    const testSeries = await prisma.testSeries.findFirst({
      where: { id, organizationId: auth.orgId || '' }
    })

    if (!testSeries) {
      return NextResponse.json({ success: false, error: 'Test Series not found' }, { status: 404 })
    }

    const test = await prisma.test.create({
      data: {
        title,
        status,
        sortOrder: Number(sortOrder) || 0,
        isLive: Boolean(isLive),
        isLocked: Boolean(isLocked),
        numberOfQuestions: Number(numberOfQuestions) || 0,
        totalMarks: Number(totalMarks) || 0,
        totalDuration: Number(totalDuration) || 0,
        isPdfTest: Boolean(isPdfTest),
        pdfUrl: pdfUrl || null,
        testMode: testMode || 'CBT',
        allowPdfDownload: Boolean(allowPdfDownload),
        allowPdfExport: Boolean(allowPdfDownload),
        pdfPasswordProtected: Boolean(pdfPasswordProtected),
        negativeMarks: Number(negativeMarks) || 0,
        sectionWiseMarks: Boolean(sectionWiseMarks),
        partialScoring: Boolean(partialScoring),
        maxAttempts: Number(maxAttempts) || 1,
        shuffleQuestions: Boolean(shuffleQuestions),
        shuffleOptions: Boolean(shuffleOptions),
        displayPause: Boolean(displayPause),
        allCompulsory: Boolean(allCompulsory),
        displayResults: Boolean(displayResults),
        displayRank: Boolean(displayRank),
        showSolution: Boolean(showSolution),
        showPercentile: Boolean(showPercentile),
        showTotalStudents: Boolean(showTotalStudents),
        instructions: instructions || null,
        testSeriesId: id,
        organizationId: auth.orgId || ''
      }
    })

    return NextResponse.json({ success: true, test })
  } catch (error) {
    console.error('Error creating test:', error)
    return NextResponse.json({ success: false, error: 'Failed to create test' }, { status: 500 })
  }
}

