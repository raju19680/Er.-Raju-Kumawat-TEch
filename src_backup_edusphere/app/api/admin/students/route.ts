import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const students = await db.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        createdAt: true,
        teacher: { select: { name: true } },
        _count: {
          select: {
            enrollments: true,
            testAttempts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ students })
  } catch (error) {
    console.error('Admin students error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
