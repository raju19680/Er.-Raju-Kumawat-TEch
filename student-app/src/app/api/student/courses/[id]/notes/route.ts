import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const lessonId = searchParams.get('lessonId')

    if (!lessonId) {
      return NextResponse.json({ success: false, message: 'Lesson ID is required' }, { status: 400 })
    }

    const student = await db.student.findFirst({ where: { userId: auth.id } })
    if (!student) return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 })

    const notes = await db.courseNote.findMany({
      where: {
        studentId: student.id,
        lessonId
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, notes })
  } catch (error) {
    console.error('Notes GET Error:', error)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

    const { lessonId, content, timestamp } = await req.json()
    if (!lessonId || !content) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 })
    }

    const student = await db.student.findFirst({ where: { userId: auth.id } })
    if (!student) return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 })

    const note = await db.courseNote.create({
      data: {
        studentId: student.id,
        lessonId,
        content,
        timestamp,
        organizationId: auth.orgId,
      }
    })

    return NextResponse.json({ success: true, note })
  } catch (error) {
    console.error('Notes POST Error:', error)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}
