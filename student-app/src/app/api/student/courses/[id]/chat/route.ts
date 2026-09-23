
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    
    const { id: courseId } = await params
    
    let chat = await db.courseChat.findFirst({
      where: { courseId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })
    
    if (!chat) {
      chat = await db.courseChat.create({
        data: { courseId },
        include: { messages: true }
      })
    }
    
    return NextResponse.json(chat.messages)
  } catch (error) {
    console.error('Chat GET Error:', error)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    
    const { id: courseId } = await params
    const { content } = await req.json()
    
    let chat = await db.courseChat.findFirst({ where: { courseId } })
    if (!chat) {
      chat = await db.courseChat.create({ data: { courseId } })
    }
    
    const student = await db.student.findFirst({ where: { userId: auth.id } })
    
    const message = await db.courseChatMessage.create({
      data: {
        chatId: chat.id,
        authorId: student?.id || auth.id,
        authorName: student?.name || auth.name || 'Student',
        authorRole: 'student',
        content
      }
    })
    
    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error('Chat POST Error:', error)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}
