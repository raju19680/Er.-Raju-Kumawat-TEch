import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const questionId = searchParams.get('questionId') || ''
    const status = searchParams.get('status') || ''
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (questionId) {
      where.questionId = questionId
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { reason: { contains: search,  } },
      ]
    }

    const [items, total] = await Promise.all([
      db.reportedQuestion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          question: {
            select: {
              id: true,
              title: true,
              type: true,
              testId: true,
            },
          },
        },
      }),
      db.reportedQuestion.count({ where }),
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (error) {
    console.error('Failed to fetch reported questions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reported questions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // No module access check - students can report questions
    const body = await request.json()

    if (!body.questionId) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      )
    }

    if (!body.reason) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      )
    }

    // Verify the question exists
    const question = await db.question.findUnique({
      where: { id: body.questionId },
    })

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    const reportedQuestion = await db.reportedQuestion.create({
      data: {
        questionId: body.questionId,
        studentId: body.studentId || null,
        reason: body.reason,
        status: body.status || 'pending',
      },
    })

    return NextResponse.json({ success: true, item: reportedQuestion }, { status: 201 })
  } catch (error) {
    console.error('Failed to create reported question:', error)
    return NextResponse.json(
      { error: 'Failed to create reported question' },
      { status: 500 }
    )
  }
}
