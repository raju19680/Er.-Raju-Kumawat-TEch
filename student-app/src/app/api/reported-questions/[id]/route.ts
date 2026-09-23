import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const reportedQuestion = await db.reportedQuestion.findUnique({
      where: { id },
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
    })

    if (!reportedQuestion) {
      return NextResponse.json(
        { error: 'Reported question not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, item: reportedQuestion })
  } catch (error) {
    console.error('Failed to fetch reported question:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reported question' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'settings')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params
    const body = await request.json()

    const existing = await db.reportedQuestion.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Reported question not found' },
        { status: 404 }
      )
    }

    // Only status can be updated: pending/resolved/dismissed
    if (!body.status || !['pending', 'resolved', 'dismissed'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Status must be "pending", "resolved", or "dismissed"' },
        { status: 400 }
      )
    }

    const reportedQuestion = await db.reportedQuestion.update({
      where: { id },
      data: {
        status: body.status,
      },
    })

    return NextResponse.json({ success: true, item: reportedQuestion })
  } catch (error) {
    console.error('Failed to update reported question:', error)
    return NextResponse.json(
      { error: 'Failed to update reported question' },
      { status: 500 }
    )
  }
}

// No DELETE - reports should never be deleted, only resolved/dismissed
