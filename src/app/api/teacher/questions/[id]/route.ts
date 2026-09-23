export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const question = await db.question.findUnique({ where: { id } })
    if (!question) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(question)
  } catch (error) {
    console.error('Failed to fetch question:', error)
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'question-library')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id } = await params
    const body = await request.json()

    const question = await db.question.update({
      where: { id },
      data: {
        type: body.type,
        heading: body.heading,
        directive: body.directive,
        title: body.title,
        image1: body.image1,
        image2: body.image2,
        image3: body.image3,
        option1: body.option1,
        option2: body.option2,
        option3: body.option3,
        option4: body.option4,
        option5: body.option5,
        option1Image: body.option1Image,
        option2Image: body.option2Image,
        option3Image: body.option3Image,
        option4Image: body.option4Image,
        option5Image: body.option5Image,
        correctOption: body.correctOption,
        solutionHeading: body.solutionHeading,
        solutionImage1: body.solutionImage1,
        solutionImage2: body.solutionImage2,
        solutionVideo: body.solutionVideo,
        solutionText: body.solutionText,
        section: body.section,
        positiveMarks: body.positiveMarks,
        negativeMarks: body.negativeMarks,
        sortOrder: body.sortOrder,
      },
    })

    return NextResponse.json(question)
  } catch (error) {
    console.error('Failed to update question:', error)
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'question-library')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id } = await params
    await db.question.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete question:', error)
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
  }
}

