export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDemoOrgId } from '@/lib/demo-org'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'tests')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const testSeriesId = searchParams.get('testSeriesId') || ''
    const skip = (page - 1) * limit

    const orgId = await getDemoOrgId(request)
    const where: Record<string, unknown> = { organizationId: orgId }
    if (search) {
      where.OR = [{ title: { contains: search } }]
    }
    if (testSeriesId) {
      where.testSeriesId = testSeriesId
    }
    // Filter by test type
    const testType = searchParams.get('testType') || ''
    if (testType === 'pdf') {
      where.isPdfTest = true
    } else if (testType === 'subjective') {
      where.isSubjective = true
    } else if (testType === 'objective') {
      where.isPdfTest = false
      where.isSubjective = false
    }

    const [items, total] = await Promise.all([
      db.test.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          testSeries: { select: { id: true, title: true } },
          _count: { select: { questions: true, testAttempts: true } },
        },
      }),
      db.test.count({ where }),
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (error) {
    console.error('TEST FETCH ERROR:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tests' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'tests')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!body.testSeriesId) {
      return NextResponse.json({ error: 'Test Series ID is required' }, { status: 400 })
    }

    const orgId = await getDemoOrgId(request)

    const test = await db.test.create({
      data: {
        title: body.title,
        instructions: body.instructions || null,
        status: body.status || 'free',
        isLive: body.isLive ?? false,
        isLocked: body.isLocked ?? false,
        numberOfQuestions: body.numberOfQuestions ?? 0,
        totalMarks: body.totalMarks ?? 0,
        totalDuration: body.totalDuration ?? 0,
        sortOrder: body.sortOrder ?? 0,
        negativeMarks: body.negativeMarks ?? 0,
        isPdfTest: body.isPdfTest ?? false,
        pdfUrl: body.pdfUrl || null,
        isSubjective: body.isSubjective ?? false,
        testSeriesId: body.testSeriesId,
          organizationId: orgId,
          themeId: body.themeId || null,
          seoTitle: body.seoTitle || null,
          seoDescription: body.seoDescription || null,
          richSnippets: body.richSnippets ?? true,
        },
    })

    return NextResponse.json(test, { status: 201 })
  } catch (error) {
    console.error('Failed to create test:', error)
    return NextResponse.json({ error: 'Failed to create test' }, { status: 500 })
  }
}


