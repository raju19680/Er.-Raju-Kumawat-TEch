import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const announcements = await db.announcement.findMany({
      where: {
        isActive: true,
        targetRole: { in: ['all', 'student'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({
      success: true,
      announcements,
    })
  } catch (error) {
    console.error('Student announcements fetch error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
