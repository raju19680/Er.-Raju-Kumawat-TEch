import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const courses = await db.course.findMany({
      select: {
        id: true,
        title: true,
        price: true,
        isPublished: true,
        category: true,
        level: true,
        createdAt: true,
        teacher: { select: { id: true, name: true, username: true } },
        _count: { select: { lessons: true, enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const testSeries = await db.testSeries.findMany({
      select: {
        id: true,
        title: true,
        price: true,
        isPublished: true,
        category: true,
        createdAt: true,
        teacher: { select: { id: true, name: true, username: true } },
        _count: { select: { tests: true, purchases: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ courses, testSeries })
  } catch (error) {
    console.error('Admin courses error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
