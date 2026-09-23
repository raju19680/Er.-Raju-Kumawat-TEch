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

    const { id } = await params
    if (!id) {
      return NextResponse.json({ success: false, error: 'Test ID is required' }, { status: 400 })
    }

    const existingTest = await prisma.test.findUnique({
      where: { id },
      include: { testSeries: true }
    })

    if (!existingTest || existingTest.testSeries?.organizationId !== auth.orgId) {
      return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 })
    }

    const questions = await prisma.question.findMany({
      where: { testId: id },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({ success: true, questions })
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch questions' }, { status: 500 })
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
      return NextResponse.json({ success: false, error: 'Test ID is required' }, { status: 400 })
    }

    const existingTest = await prisma.test.findUnique({
      where: { id },
      include: { testSeries: true }
    })

    if (!existingTest || existingTest.testSeries?.organizationId !== auth.orgId) {
      return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 })
    }

    const data = await request.json()

    const maxSortOrderResult = await prisma.question.aggregate({
      where: { testId: id },
      _max: { sortOrder: true }
    })
    const sortOrder = (maxSortOrderResult._max.sortOrder || 0) + 1

    const question = await prisma.question.create({
      data: {
        testId: id,
        title: data.title,
        option1: data.option1,
        option2: data.option2,
        option3: data.option3,
        option4: data.option4,
        correctOption: data.correctOption !== null && data.correctOption !== undefined ? String(data.correctOption) : null,
        positiveMarks: data.positiveMarks || 1,
        negativeMarks: data.negativeMarks || 0,
        solutionText: data.solutionText || null,
        image1: data.image1 || null,
        option1Image: data.option1Image || null,
        option2Image: data.option2Image || null,
        option3Image: data.option3Image || null,
        option4Image: data.option4Image || null,
        solutionImage1: data.solutionImage1 || null,
        sortOrder
      }
    })

    return NextResponse.json({ success: true, question })
  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json({ success: false, error: 'Failed to create question: ' + (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}

