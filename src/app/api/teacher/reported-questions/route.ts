export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'tests')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const items = await db.reportedQuestion.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        question: {
          select: { title: true, test: { select: { title: true } } },
        },
      },
      take: 50,
    })

    const formatted = items.map((item) => ({
      id: item.id,
      studentName: 'Student',
      testTitle: item.question.test?.title || 'Unknown',
      questionTitle: item.question.title,
      reason: item.reason,
      comment: item.reason,
      createdAt: item.createdAt.toISOString(),
      status: item.status,
    }))

    return NextResponse.json({ items: formatted })
  } catch (error) {
    console.error('Failed to fetch reported questions:', error)
    return NextResponse.json({ error: 'Failed to fetch reported questions' }, { status: 500 })
  }
}

