import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await context.params
    const authResult = await getAuthStudent(req)
    if (authResult.error || !authResult.student) {
      return NextResponse.json({ success: false, error: authResult.error || 'Unauthorized' }, { status: authResult.status || 401 })
    }

    let chat = await db.courseChat.findFirst({
      where: { courseId },
    })

    if (!chat) {
      chat = await db.courseChat.create({
        data: { courseId },
      })
    }

    const messages = await db.courseChatMessage.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ success: true, messages })
  } catch (error) {
    console.error('Chat GET Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await context.params
    const authResult = await getAuthStudent(req)
    if (authResult.error || !authResult.student) {
      return NextResponse.json({ success: false, error: authResult.error || 'Unauthorized' }, { status: authResult.status || 401 })
    }
    const student = authResult.student

    const body = await req.json()
    const { content } = body

    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 })
    }

    let chat = await db.courseChat.findFirst({
      where: { courseId },
    })

    if (!chat) {
      chat = await db.courseChat.create({
        data: { courseId },
      })
    }

    const message = await db.courseChatMessage.create({
      data: {
        chatId: chat.id,
        content: content.trim(),
        authorId: student.id,
        authorName: student.name,
        authorRole: 'student',
      },
    })

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error('Chat POST Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 })
  }
}
