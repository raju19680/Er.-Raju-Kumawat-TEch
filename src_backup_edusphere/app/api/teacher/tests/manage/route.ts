import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// POST - Create a test/question, or GET test with questions
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { action } = body

    if (action === 'create-test') {
      const { testSeriesId, title, description, duration, totalMarks, passingMarks } = body

      if (!testSeriesId || !title) {
        return NextResponse.json(
          { error: 'Test series ID and title are required' },
          { status: 400 }
        )
      }

      const ts = await db.testSeries.findFirst({
        where: { id: testSeriesId, teacherId: session.id },
      })
      if (!ts) {
        return NextResponse.json({ error: 'Test series not found' }, { status: 404 })
      }

      const testCount = await db.test.count({ where: { testSeriesId } })

      const test = await db.test.create({
        data: {
          title,
          description: description || null,
          duration: parseInt(duration) || 60,
          totalMarks: parseInt(totalMarks) || 100,
          passingMarks: parseInt(passingMarks) || 40,
          order: testCount,
          testSeriesId,
        },
      })

      await db.testSeries.update({
        where: { id: testSeriesId },
        data: { totalTests: { increment: 1 } },
      })

      return NextResponse.json({ test }, { status: 201 })
    }

    if (action === 'create-question') {
      const { testId, text, options, correctAnswer, explanation, marks } = body

      if (!testId || !text || !options || correctAnswer === undefined) {
        return NextResponse.json(
          { error: 'Test ID, question text, options, and correct answer are required' },
          { status: 400 }
        )
      }

      const test = await db.test.findFirst({
        where: { id: testId, testSeries: { teacherId: session.id } },
      })
      if (!test) {
        return NextResponse.json({ error: 'Test not found' }, { status: 404 })
      }

      const question = await db.question.create({
        data: {
          text,
          options: JSON.stringify(options),
          correctAnswer: parseInt(correctAnswer),
          explanation: explanation || null,
          marks: parseInt(marks) || 1,
          testId,
        },
      })

      return NextResponse.json({ question }, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Test action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Get test with questions (for teacher)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const testId = searchParams.get('testId')

    if (testId) {
      const test = await db.test.findFirst({
        where: { id: testId, testSeries: { teacherId: session.id } },
        include: { questions: { orderBy: { createdAt: 'asc' } } },
      })
      if (!test) {
        return NextResponse.json({ error: 'Test not found' }, { status: 404 })
      }
      return NextResponse.json({ test })
    }

    return NextResponse.json({ error: 'Test ID is required' }, { status: 400 })
  } catch (error) {
    console.error('Get test error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a test or question
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const testId = searchParams.get('testId')
    const questionId = searchParams.get('questionId')

    if (questionId) {
      const question = await db.question.findFirst({
        where: { id: questionId, test: { testSeries: { teacherId: session.id } } },
      })
      if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 })
      }
      await db.question.delete({ where: { id: questionId } })
      return NextResponse.json({ success: true })
    }

    if (testId) {
      const test = await db.test.findFirst({
        where: { id: testId, testSeries: { teacherId: session.id } },
      })
      if (!test) {
        return NextResponse.json({ error: 'Test not found' }, { status: 404 })
      }
      await db.testSeries.update({
        where: { id: test.testSeriesId },
        data: { totalTests: { decrement: 1 } },
      })
      await db.test.delete({ where: { id: testId } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Test ID or Question ID is required' }, { status: 400 })
  } catch (error) {
    console.error('Delete test error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
