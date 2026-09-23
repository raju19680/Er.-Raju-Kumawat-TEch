export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

interface BulkQuestion {
  type?: string
  heading?: string
  title: string
  option1?: string
  option2?: string
  option3?: string
  option4?: string
  option5?: string
  correctOption?: string
  positiveMarks?: number
  negativeMarks?: number
  section?: string
  solutionText?: string
  solutionHeading?: string
  solutionImage1?: string
  solutionImage2?: string
  solutionVideo?: string
  image1?: string
  image2?: string
  image3?: string
  option1Image?: string
  option2Image?: string
  option3Image?: string
  option4Image?: string
  option5Image?: string
  directive?: string
}

export async function POST(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'question-library')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()
    const { testId, questions }: { testId: string; questions: BulkQuestion[] } = body

    if (!testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 })
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Questions array is required and must not be empty' }, { status: 400 })
    }
    if (questions.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 questions can be uploaded at once' }, { status: 400 })
    }

    // Verify test exists
    const test = await db.test.findUnique({ where: { id: testId } })
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Get current max sortOrder
    const maxOrder = await db.question.findFirst({
      where: { testId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })
    const startOrder = (maxOrder?.sortOrder ?? -1) + 1

    // Validate questions
    const invalid = questions.findIndex((q) => !q.title?.trim())
    if (invalid !== -1) {
      return NextResponse.json({ error: `Question at row ${invalid + 1} is missing the question text` }, { status: 400 })
    }

    // Bulk insert
    await db.question.createMany({
      data: questions.map((q, idx) => ({
        type: q.type || 'mcq',
        heading: q.heading?.trim() || null,
        directive: q.directive?.trim() || null,
        title: q.title.trim(),
        option1: q.option1?.trim() || null,
        option2: q.option2?.trim() || null,
        option3: q.option3?.trim() || null,
        option4: q.option4?.trim() || null,
        option5: q.option5?.trim() || null,
        correctOption: q.correctOption?.trim() || null,
        positiveMarks: typeof q.positiveMarks === 'number' ? q.positiveMarks : 1,
        negativeMarks: typeof q.negativeMarks === 'number' ? q.negativeMarks : 0,
        section: q.section?.trim() || null,
        solutionText: q.solutionText?.trim() || null,
        solutionHeading: q.solutionHeading?.trim() || null,
        solutionImage1: q.solutionImage1 || null,
        solutionImage2: q.solutionImage2 || null,
        solutionVideo: q.solutionVideo || null,
        image1: q.image1 || null,
        image2: q.image2 || null,
        image3: q.image3 || null,
        option1Image: q.option1Image || null,
        option2Image: q.option2Image || null,
        option3Image: q.option3Image || null,
        option4Image: q.option4Image || null,
        option5Image: q.option5Image || null,
        sortOrder: startOrder + idx,
        testId,
      })),
    })

    // Update test question count
    const newCount = await db.question.count({ where: { testId } })
    await db.test.update({
      where: { id: testId },
      data: { numberOfQuestions: newCount },
    })

    return NextResponse.json({
      success: true,
      created: questions.length,
      totalQuestions: newCount,
      message: `Successfully uploaded ${questions.length} questions`,
    })
  } catch (error) {
    console.error('Bulk upload error:', error)
    return NextResponse.json({ error: 'Failed to bulk upload questions' }, { status: 500 })
  }
}

