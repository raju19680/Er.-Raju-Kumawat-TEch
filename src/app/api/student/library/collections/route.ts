import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function POST(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const { name, description } = await req.json()

    if (!name) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 })
    }

    const collection = await db.collection.create({
      data: {
        name,
        description,
        studentId: student.id,
        organizationId: auth.orgId,
      },
      include: {
        _count: {
          select: { bookmarks: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: collection
    })
  } catch (error) {
    console.error('Student library collection POST error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
