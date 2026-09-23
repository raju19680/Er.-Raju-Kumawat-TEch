export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'
import { getAuthUser } from '@/lib/auth-helpers'

export async function POST(req: NextRequest) {
  try {
    const access = await checkModuleAccess(req, 'tests')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await req.json()
    const { action } = body

    if (action === 'create-test') {
      const { testSeriesId, title, description, duration, totalMarks, passingMarks } = body
      if (!testSeriesId || !title) {
        return NextResponse.json({ error: 'testSeriesId and title are required' }, { status: 400 })
      }

      // Get orgId from auth
      const auth = await getAuthUser(req)
      if (!auth?.orgId) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
      }

      const testCount = await db.test.count({ where: { testSeriesId } })
      const test = await db.test.create({
        data: {
          title,
          // description: description || null,
          totalDuration: parseInt(duration) || 60,
          totalMarks: parseFloat(totalMarks) || 100,
          // passingMarks: parseFloat(passingMarks) || 40,
          sortOrder: testCount,
          testSeriesId,
          organizationId: auth.orgId,
        },
      })
      return NextResponse.json({ success: true, test }, { status: 201 })
    }

    if (action === 'create-question') {
      const { testId, text, options, correctAnswer, explanation, marks } = body
      if (!testId || !text || !options) {
        return NextResponse.json({ error: 'testId, text, and options are required' }, { status: 400 })
      }

      const question = await db.question.create({
        data: {
          title: text,
          option1: options[0] || '',
          option2: options[1] || '',
          option3: options[2] || '',
          option4: options[3] || '',
          option5: options[4] || null,
          correctOption: String(parseInt(correctAnswer) + 1),
          solutionText: explanation || null,
          positiveMarks: parseFloat(marks) || 1,
          testId,
        },
      })
      return NextResponse.json({ success: true, question }, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Tests manage error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const access = await checkModuleAccess(req, 'tests')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { searchParams } = new URL(req.url)
    const testId = searchParams.get('testId')

    if (testId) {
      const test = await db.test.findUnique({
        where: { id: testId },
        include: { questions: { orderBy: { sortOrder: 'asc' } } },
      })
      if (!test) {
        return NextResponse.json({ error: 'Test not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, test })
    }

    return NextResponse.json({ error: 'testId is required' }, { status: 400 })
  } catch (error) {
    console.error('Get test error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const access = await checkModuleAccess(req, 'tests')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { searchParams } = new URL(req.url)
    const testId = searchParams.get('testId')
    const questionId = searchParams.get('questionId')

    if (questionId) {
      await db.question.delete({ where: { id: questionId } })
      return NextResponse.json({ success: true })
    }

    if (testId) {
      await db.test.delete({ where: { id: testId } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'testId or questionId is required' }, { status: 400 })
  } catch (error) {
    console.error('Delete test error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

