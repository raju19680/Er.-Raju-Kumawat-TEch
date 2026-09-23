export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req)
    if (!auth || (auth.role !== 'platform_admin' && auth.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const courses = await db.course.findMany({
      select: {
        id: true,
        title: true,
        price: true,
        status: true,
        category: true,
        level: true,
        createdAt: true,
        _count: { select: { modules: true, purchasedBy: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const testSeries = await db.testSeries.findMany({
      select: {
        id: true,
        title: true,
        price: true,
        status: true,
        category: true,
        createdAt: true,
        _count: { select: { tests: true, purchasedBy: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ courses, testSeries })
  } catch (error) {
    console.error('Admin courses error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
