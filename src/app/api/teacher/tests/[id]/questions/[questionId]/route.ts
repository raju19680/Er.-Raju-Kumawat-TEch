export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrTeacher } from '@/lib/auth-helpers'
import { db as prisma } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, questionId: string }> }
) {
  try {
    const authResult = await requireAdminOrTeacher(request)
    if (authResult.error) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status })
    }
    const auth = authResult.user
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, questionId } = await params
    if (!id || !questionId) {
      return NextResponse.json({ success: false, error: 'Test ID and Question ID are required' }, { status: 400 })
    }

    const existingTest = await prisma.test.findUnique({
      where: { id },
      include: { testSeries: true }
    })

    if (!existingTest || existingTest.testSeries?.organizationId !== auth.orgId) {
      return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 })
    }

    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId }
    })

    if (!existingQuestion || existingQuestion.testId !== id) {
      return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 })
    }

    const data = await request.json()

    const question = await prisma.question.update({
      where: { id: questionId },
      data: {
        title: data.title !== undefined ? data.title : undefined,
        option1: data.option1 !== undefined ? data.option1 : undefined,
        option2: data.option2 !== undefined ? data.option2 : undefined,
        option3: data.option3 !== undefined ? data.option3 : undefined,
        option4: data.option4 !== undefined ? data.option4 : undefined,
        correctOption: data.correctOption !== undefined && data.correctOption !== null ? String(data.correctOption) : data.correctOption === null ? null : undefined,
        positiveMarks: data.positiveMarks !== undefined ? data.positiveMarks : undefined,
        negativeMarks: data.negativeMarks !== undefined ? data.negativeMarks : undefined,
        solutionText: data.solutionText !== undefined ? data.solutionText : undefined,
        image1: data.image1 !== undefined ? data.image1 : undefined,
        option1Image: data.option1Image !== undefined ? data.option1Image : undefined,
        option2Image: data.option2Image !== undefined ? data.option2Image : undefined,
        option3Image: data.option3Image !== undefined ? data.option3Image : undefined,
        option4Image: data.option4Image !== undefined ? data.option4Image : undefined,
        solutionImage1: data.solutionImage1 !== undefined ? data.solutionImage1 : undefined,
        sortOrder: data.sortOrder !== undefined ? data.sortOrder : undefined
      }
    })

    return NextResponse.json({ success: true, question })
  } catch (error) {
    console.error('Error updating question:', error)
    return NextResponse.json({ success: false, error: 'Failed to update question' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, questionId: string }> }
) {
  try {
    const authResult = await requireAdminOrTeacher(request)
    if (authResult.error) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status })
    }
    const auth = authResult.user
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, questionId } = await params
    if (!id || !questionId) {
      return NextResponse.json({ success: false, error: 'Test ID and Question ID are required' }, { status: 400 })
    }

    const existingTest = await prisma.test.findUnique({
      where: { id },
      include: { testSeries: true }
    })

    if (!existingTest || existingTest.testSeries?.organizationId !== auth.orgId) {
      return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 })
    }

    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId }
    })

    if (!existingQuestion || existingQuestion.testId !== id) {
      return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 })
    }

    await prisma.question.delete({
      where: { id: questionId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting question:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete question' }, { status: 500 })
  }
}

