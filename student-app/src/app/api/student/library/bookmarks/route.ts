import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function POST(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const { title, url, resourceType, resourceId, collectionId, tagIds } = await req.json()

    if (!title || !resourceType || !resourceId) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 })
    }

    const bookmark = await db.bookmark.create({
      data: {
        title,
        url,
        resourceType,
        resourceId,
        studentId: student.id,
        collectionId: collectionId || null,
        organizationId: auth.orgId,
        tags: tagIds ? {
          connect: tagIds.map((id: string) => ({ id }))
        } : undefined
      },
      include: {
        tags: true,
        collection: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json({
      success: true,
      data: bookmark
    })
  } catch (error) {
    console.error('Student library bookmark POST error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
