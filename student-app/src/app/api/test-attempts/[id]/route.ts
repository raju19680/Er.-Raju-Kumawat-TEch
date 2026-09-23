import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const testAttempt = await db.testAttempt.findUnique({
      where: { id },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            instructions: true,
            totalMarks: true,
            totalDuration: true,
            numberOfQuestions: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    if (!testAttempt) {
      return NextResponse.json(
        { error: 'Test attempt not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, item: testAttempt })
  } catch (error) {
    console.error('Failed to fetch test attempt:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test attempt' },
      { status: 500 }
    )
  }
}

// No PUT - attempts are immutable once completed
// No DELETE - attempts should never be deleted
