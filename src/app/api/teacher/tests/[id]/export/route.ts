export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifyAuth(req)
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(req.url)
    const includeSolutions = searchParams.get('solutions') === 'true'

    const test = await (prisma as any).test?.findUnique({
      where: {
        id,
        ...(session.organizationId ? { organizationId: session.organizationId } : {})
      },
      include: {
        examProfile: true,
        questions: {
          orderBy: { order: 'asc' },
          include: {
            question: {
              include: {
                options: true
              }
            }
          }
        }
      }
    })

    if (!test) {
      return NextResponse.json({ success: false, message: 'Test not found' }, { status: 404 })
    }

    // Format for export
    const exportData = {
      testName: test.title,
      examName: test.examProfile?.name || '',
      duration: test.duration,
      totalMarks: test.totalMarks,
      questions: test.questions.map((tq: any, index: number) => {
        const q = tq.question
        return {
          questionNumber: index + 1,
          content: q.content,
          type: q.type,
          options: q.options.map((opt: any) => ({
            id: opt.id,
            content: opt.content,
            isCorrect: includeSolutions ? opt.isCorrect : undefined
          })),
          solution: includeSolutions ? q.solution : undefined,
          marks: q.marks,
          negativeMarks: q.negativeMarks
        }
      })
    }

    return NextResponse.json({ success: true, data: exportData })
  } catch (error) {
    console.error('Error exporting test:', error)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}

