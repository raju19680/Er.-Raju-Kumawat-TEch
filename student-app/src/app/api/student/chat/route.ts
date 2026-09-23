import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) return NextResponse.json({ success: false, message: error }, { status: status || 401 })

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')
    if (!courseId) return NextResponse.json({ success: false, message: 'courseId required' }, { status: 400 })

    let chat = await db.courseChat.findFirst({
      where: { courseId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } }
      }
    })

    if (!chat) {
      chat = await db.courseChat.create({
        data: { courseId },
        include: { messages: true }
      })
    }

    return NextResponse.json({ success: true, data: chat.messages })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) return NextResponse.json({ success: false, message: error }, { status: status || 401 })

    const { courseId, content } = await req.json()
    if (!courseId || !content) return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 })

    let chat = await db.courseChat.findFirst({ where: { courseId } })
    if (!chat) chat = await db.courseChat.create({ data: { courseId } })

    const message = await db.courseChatMessage.create({
      data: {
        chatId: chat.id,
        content,
        authorId: student.id,
        authorRole: 'student',
        authorName: student.name || 'Student'
      }
    })

    return NextResponse.json({ success: true, data: message })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}
