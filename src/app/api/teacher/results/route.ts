export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'results')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const searchParams = request.nextUrl.searchParams
    const testSeriesId = searchParams.get('testSeriesId') || ''
    const subject = searchParams.get('subject') || ''
    const type = searchParams.get('type') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { status: 'completed' }
    if (testSeriesId) {
      where.test = { testSeriesId }
    }
    // Filter by subject (section) - join through test → questions with matching section
    if (subject) {
      where.test = {
        ...(where.test as Record<string, unknown> || {}),
        questions: { some: { section: subject } },
      }
    }
    // Filter by test type (mcq/numerical/comprehension) - tests whose questions match
    if (type) {
      where.test = {
        ...(where.test as Record<string, unknown> || {}),
        questions: { some: { type } },
      }
    }

    const [items, total] = await Promise.all([
      db.testAttempt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { completedAt: 'desc' },
        include: {
          student: { select: { name: true, email: true } },
          test: { select: { title: true, totalMarks: true } },
        },
      }),
      db.testAttempt.count({ where }),
    ])

    const formatted = items.map((item) => ({
      id: item.id,
      studentName: item.student.name,
      studentEmail: item.student.email,
      testTitle: item.test.title,
      timeTaken: item.timeTaken,
      score: item.score,
      totalMarks: item.test.totalMarks,
      reevaluatedMarks: null,
      completedAt: item.completedAt?.toISOString() || item.startedAt.toISOString(),
    }))

    return NextResponse.json({ items: formatted, total, page, limit })
  } catch (error) {
    console.error('Failed to fetch results:', error)
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 })
  }
}

