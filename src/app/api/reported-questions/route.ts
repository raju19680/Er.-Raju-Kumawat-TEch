import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const questionId = searchParams.get('questionId') || ''
    const status = searchParams.get('status') || ''
    const testId = searchParams.get('testId') || ''
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      question: {
        test: {
          organizationId: authUser.orgId
        }
      }
    }

    if (questionId) {
      where.questionId = questionId
    }

    if (testId) {
      (where.question as any).testId = testId
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
              test: {
                select: { title: true }
              }
            },
          },
        },
      }),
      db.reportedQuestion.count({ where }),
    ])

    const formattedItems = items.map((item: any) => ({
      id: item.id,
      questionId: item.questionId,
      questionTitle: item.question?.title || 'Unknown Question',
      testName: item.question?.test?.title || 'Unknown Test',
      reportedBy: item.studentId || 'Anonymous',
      reason: item.reason,
      status: item.status,
      date: item.createdAt.toISOString().split('T')[0],
    }))

    return NextResponse.json({ items: formattedItems, total, page, limit })
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
