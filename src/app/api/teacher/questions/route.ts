export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'question-library')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const testId = searchParams.get('testId') || ''
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { heading: { contains: search } },
      ]
    }
    if (testId) {
      where.testId = testId
    }

    const [items, total] = await Promise.all([
      db.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
      }),
      db.question.count({ where }),
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (error) {
    console.error('Failed to fetch questions:', error)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'question-library')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()
    if (!body.title) {
      return NextResponse.json({ error: 'Question text is required' }, { status: 400 })
    }
    if (!body.testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 })
    }

    const question = await db.question.create({
      data: {
        type: body.type || 'mcq',
        heading: body.heading || null,
        directive: body.directive || null,
        title: body.title,
        image1: body.image1 || null,
        image2: body.image2 || null,
        image3: body.image3 || null,
        option1: body.option1 || null,
        option2: body.option2 || null,
        option3: body.option3 || null,
        option4: body.option4 || null,
        option5: body.option5 || null,
        option1Image: body.option1Image || null,
        option2Image: body.option2Image || null,
        option3Image: body.option3Image || null,
        option4Image: body.option4Image || null,
        option5Image: body.option5Image || null,
        correctOption: body.correctOption || null,
        solutionHeading: body.solutionHeading || null,
        solutionImage1: body.solutionImage1 || null,
        solutionImage2: body.solutionImage2 || null,
        solutionVideo: body.solutionVideo || null,
        solutionText: body.solutionText || null,
        section: body.section || null,
        positiveMarks: body.positiveMarks ?? 1,
        negativeMarks: body.negativeMarks ?? 0,
        sortOrder: body.sortOrder ?? 0,
        testId: body.testId,
      },
    })

    // Update test question count
    const questionCount = await db.question.count({ where: { testId: body.testId } })
    await db.test.update({
      where: { id: body.testId },
      data: { numberOfQuestions: questionCount },
    })

    return NextResponse.json(question, { status: 201 })
  } catch (error) {
    console.error('Failed to create question:', error)
    return NextResponse.json({ error: 'Failed to create question: ' + (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}

