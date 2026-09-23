import { NextRequest, NextResponse } from "next/server"
import { db as prisma } from "@/lib/db"
import { getAuthUser } from "@/lib/auth-helpers"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 })
    }

    const chat = await prisma.courseChat.findFirst({
      where: { courseId }
    })

    if (!chat) {
      return NextResponse.json([])
    }

    const messages = await prisma.courseChatMessage.findMany({
      where: {
        chatId: chat.id
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching chat messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 })
    }

    const { content } = await req.json()
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }
    
    const authUser = await getAuthUser(req)
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Find or create chat
    let chat = await prisma.courseChat.findFirst({
      where: { courseId }
    })

    if (!chat) {
      chat = await prisma.courseChat.create({
        data: { courseId }
      })
    }

    const message = await prisma.courseChatMessage.create({
      data: {
        content: content.trim(),
        chatId: chat.id,
        authorId: authUser.id,
        authorRole: authUser.role || 'student',
        authorName: authUser.name || 'User',
      },
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error("Error posting chat message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
