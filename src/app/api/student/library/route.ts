import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const collections = await db.collection.findMany({
      where: { studentId: student.id },
      include: {
        _count: {
          select: { bookmarks: true }
        }
      }
    })

    const bookmarks = await db.bookmark.findMany({
      where: { studentId: student.id },
      include: {
        tags: true,
        collection: { select: { id: true, name: true } }
      }
    })

    const tags = await db.tag.findMany({
      where: { organizationId: auth.orgId }
    })

    return NextResponse.json({
      success: true,
      data: {
        collections,
        bookmarks,
        tags
      }
    })
  } catch (error) {
    console.error('Student library GET error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
