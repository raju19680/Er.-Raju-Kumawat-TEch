import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const { id: questionId } = await params

    const existing = await db.bookmark.findFirst({
      where: {
        studentId: student.id,
        resourceType: 'question',
        resourceId: questionId,
      }
    })

    if (existing) {
      // Toggle bookmark off
      await db.bookmark.delete({ where: { id: existing.id } })
      return NextResponse.json({ success: true, bookmarked: false, message: 'Bookmark removed' })
    }

    // Toggle bookmark on
    await db.bookmark.create({
      data: {
        studentId: student.id,
        organizationId: auth.orgId,
        resourceType: 'question',
        resourceId: questionId,
        title: 'Question Bookmark', 
      }
    })

    return NextResponse.json({ success: true, bookmarked: true, message: 'Question bookmarked' })

  } catch (error) {
    console.error('Bookmark error:', error)
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 })
  }
}
