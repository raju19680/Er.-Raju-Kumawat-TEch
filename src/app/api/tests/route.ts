import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const testSeriesId = searchParams.get('testSeriesId') || ''
    const status = searchParams.get('status') || ''
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { instructions: { contains: search } },
      ]
    }

    if (testSeriesId) {
      where.testSeriesId = testSeriesId
    }

    if (status === 'live') {
      where.isLive = true
    } else if (status === 'draft') {
      where.isLive = false
    } else if (status === 'free') {
      where.status = 'free'
    } else if (status === 'paid') {
      where.status = 'paid'
    }

    const [items, total] = await Promise.all([
      db.test.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          testSeries: {
            select: { id: true, title: true },
          },
          _count: {
            select: { questions: true, testAttempts: true },
          },
        },
      }),
      db.test.count({ where }),
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (error) {
    console.error('Failed to fetch tests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tests' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check module access for teachers
    const accessCheck = await checkModuleAccess(request, 'tests')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const body = await request.json()

    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!body.testSeriesId) {
      return NextResponse.json(
        { error: 'Test Series ID is required' },
        { status: 400 }
      )
    }

    if (!body.organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const test = await db.test.create({
      data: {
        title: body.title,
        instructions: body.instructions || null,
        status: body.status || 'free',
        isLive: body.isLive ?? false,
        isLocked: body.isLocked ?? false,
        numberOfQuestions: body.totalQuestions ?? 0,
        totalMarks: body.totalMarks ?? 0,
        totalDuration: body.duration ?? 0,
        sortOrder: body.sortingOrder ?? 0,
        sectionWiseMarks: body.sectionWiseMarks ?? false,
        negativeMarks: body.negativeMarks ?? 0,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        language: body.language || 'english',
        translationTitle: body.translationTitle || null,
        maxAttempts: body.maxAttempts ?? 1,
        shuffleQuestions: body.shuffleQuestions ?? false,
        shuffleOptions: body.shuffleOptions ?? false,
        displayPause: body.displayPause ?? false,
        allowAttempt: body.allowTestAttempt ?? true,
        allCompulsory: body.allCompulsory ?? true,
        uiType: body.uiType || 'default',
        isPdfTest: body.isPdfTest ?? false,
        pdfUrl: body.pdfUrl || null,
        testMode: body.testMode || 'CBT',
        allowPdfDownload: body.allowPdfDownload ?? false,
        pdfPasswordProtected: body.pdfPasswordProtected ?? false,
        attachPdf: body.attachPdf || null,
        allowPdfExport: body.allowPdfExport ?? false,
        partialScoring: body.partialScoring ?? false,
        displayResults: body.displayResults ?? true,
        resultAt: body.resultAt ? new Date(body.resultAt) : null,
        displayRank: body.displayRank ?? true,
        showSolution: body.showSolution ?? true,
        showTotalStudents: body.showTotalStudents ?? false,
        showPercentile: body.showPercentile ?? false,
        solutionLink: body.solutionLink || null,
        telegramSettings: body.telegramSettings || null,
        testSeriesId: body.testSeriesId,
        chapterId: body.chapterId || null,
        conceptId: body.conceptId || null,
        organizationId: body.organizationId,
        testSections: {
          create: body.sections?.map((s: any, idx: number) => ({
            sectionName: s.sectionName,
            maxQuestions: s.maxQuestions ?? -1,
            partTitle: s.partTitle || null,
            cutoffScore: s.cutoffScore ?? 0,
            isOptional: s.isOptional ?? false,
            fixedTiming: s.fixedTiming ?? false,
            sortOrder: idx,
          })) || []
        }
      },
    })

    return NextResponse.json(test, { status: 201 })
  } catch (error) {
    console.error('Failed to create test:', error)
    return NextResponse.json(
      { error: 'Failed to create test' },
      { status: 500 }
    )
  }
}
