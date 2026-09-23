import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const question = await db.question.findUnique({
      where: { id },
    })

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, question })
  } catch (error) {
    console.error('Failed to fetch question:', error)
    return NextResponse.json(
      { error: 'Failed to fetch question' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'tests')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Verify question exists
    const existing = await db.question.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    const question = await db.question.update({
      where: { id },
      data: {
        ...(body.type !== undefined && { type: body.type }),
        ...(body.heading !== undefined && { heading: body.heading || null }),
        ...(body.directive !== undefined && { directive: body.directive || null }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.image1 !== undefined && { image1: body.image1 || null }),
        ...(body.image2 !== undefined && { image2: body.image2 || null }),
        ...(body.image3 !== undefined && { image3: body.image3 || null }),
        ...(body.option1 !== undefined && { option1: body.option1 || null }),
        ...(body.option2 !== undefined && { option2: body.option2 || null }),
        ...(body.option3 !== undefined && { option3: body.option3 || null }),
        ...(body.option4 !== undefined && { option4: body.option4 || null }),
        ...(body.option5 !== undefined && { option5: body.option5 || null }),
        ...(body.option1Image !== undefined && { option1Image: body.option1Image || null }),
        ...(body.option2Image !== undefined && { option2Image: body.option2Image || null }),
        ...(body.option3Image !== undefined && { option3Image: body.option3Image || null }),
        ...(body.option4Image !== undefined && { option4Image: body.option4Image || null }),
        ...(body.option5Image !== undefined && { option5Image: body.option5Image || null }),
        ...(body.correctOption !== undefined && { correctOption: body.correctOption || null }),
        ...(body.solutionHeading !== undefined && { solutionHeading: body.solutionHeading || null }),
        ...(body.solutionImage1 !== undefined && { solutionImage1: body.solutionImage1 || null }),
        ...(body.solutionImage2 !== undefined && { solutionImage2: body.solutionImage2 || null }),
        ...(body.solutionVideo !== undefined && { solutionVideo: body.solutionVideo || null }),
        ...(body.solutionText !== undefined && { solutionText: body.solutionText || null }),
        ...(body.section !== undefined && { section: body.section || null }),
        ...(body.positiveMarks !== undefined && { positiveMarks: body.positiveMarks }),
        ...(body.negativeMarks !== undefined && { negativeMarks: body.negativeMarks }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        ...(body.testId !== undefined && { testId: body.testId }),
      },
    })

    return NextResponse.json({ success: true, question })
  } catch (error) {
    console.error('Failed to update question:', error)
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'tests')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params

    // Verify question exists
    const existing = await db.question.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    await db.question.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Question deleted' })
  } catch (error) {
    console.error('Failed to delete question:', error)
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    )
  }
}
