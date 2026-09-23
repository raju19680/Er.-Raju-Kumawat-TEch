import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const testId = searchParams.get('testId') || ''
    const type = searchParams.get('type') || ''
    const section = searchParams.get('section') || ''
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

    if (type) {
      where.type = type
    }

    if (section) {
      where.section = section
    }

    const [items, total] = await Promise.all([
      db.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
        include: {
          test: {
            select: { id: true, title: true },
          },
        },
      }),
      db.question.count({ where }),
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (error) {
    console.error('Failed to fetch questions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!body.testId) {
      return NextResponse.json(
        { error: 'Test ID is required' },
        { status: 400 }
      )
    }

    // Verify the test exists
    const test = await db.test.findUnique({
      where: { id: body.testId },
    })

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      )
    }

    const question = await db.question.create({
      data: {
        type: body.type || 'mcq',
        heading: body.heading || null,
        directive: body.directive || null,
        title: body.title,
        titleHi: body.titleHi || null,
        image1: body.image1 || null,
        image2: body.image2 || null,
        image3: body.image3 || null,
        option1: body.option1 || null,
        option2: body.option2 || null,
        option3: body.option3 || null,
        option4: body.option4 || null,
        option5: body.option5 || null,
        option1Hi: body.option1Hi || null,
        option2Hi: body.option2Hi || null,
        option3Hi: body.option3Hi || null,
        option4Hi: body.option4Hi || null,
        option5Hi: body.option5Hi || null,
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
        solutionTextHi: body.solutionTextHi || null,
        section: body.section || null,
        positiveMarks: body.positiveMarks ?? 1,
        negativeMarks: body.negativeMarks ?? 0,
        partialMarks: body.partialMarks ?? 0,
        sortOrder: body.sortOrder ?? 0,
        testId: body.testId,
        passageId: body.passageId || null,
      },
    })

    return NextResponse.json(question, { status: 201 })
  } catch (error) {
    console.error('Failed to create question:', error)
    return NextResponse.json(
      { error: 'Failed to create question: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}
