export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthTeacher } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const { auth, teacher, error, status } = await getAuthTeacher(req)
    if (error || !teacher || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const classes = await db.liveClass.findMany({
      include: {
        course: {
          select: { title: true }
        }
      },
      orderBy: { scheduledAt: 'asc' }
    })

    return NextResponse.json({ success: true, data: classes })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { auth, teacher, error, status } = await getAuthTeacher(req)
    if (error || !teacher || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const { title, description, courseId, scheduledAt, jitsiRoomId } = await req.json()
    if (!title || !courseId || !scheduledAt || !jitsiRoomId) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 })
    }

    const newClass = await db.liveClass.create({
      data: {
        title,
        description,
        courseId,
        scheduledAt: new Date(scheduledAt),
        jitsiRoomId,
        status: 'scheduled'
      },
      include: {
        course: {
          select: { title: true }
        }
      }
    })

    return NextResponse.json({ success: true, data: newClass })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}

