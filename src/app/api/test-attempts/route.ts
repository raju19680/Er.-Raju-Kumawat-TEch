import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const studentId = searchParams.get('studentId') || ''
    const testId = searchParams.get('testId') || ''
    const status = searchParams.get('status') || ''
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (studentId) {
      where.studentId = studentId
    }

    if (testId) {
      where.testId = testId
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { student: { name: { contains: search,  } } },
        { test: { title: { contains: search,  } } },
      ]
    }

    const [items, total] = await Promise.all([
      db.testAttempt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
          test: {
            select: {
              id: true,
              title: true,
              totalMarks: true,
              totalDuration: true,
            },
          },
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      db.testAttempt.count({ where }),
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (error) {
    console.error('Failed to fetch test attempts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test attempts' },
      { status: 500 }
    )
  }
}

// No POST - attempts are created through the student test-taking flow
