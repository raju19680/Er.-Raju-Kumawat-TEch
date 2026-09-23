import { NextRequest, NextResponse } from "next/server"
import { db as prisma } from "@/lib/db"
import { getAuthUser } from "@/lib/auth-helpers"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, postId: string }> }
) {
  try {
    const { id: courseId, postId } = await params
    if (!courseId || !postId) {
      return NextResponse.json({ error: "Course ID and Post ID are required" }, { status: 400 })
    }

    const authUser = await getAuthUser(req)
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { content } = await req.json()

    const comment = await prisma.forumComment.create({
      data: {
        content: content || "",
        postId,
        authorId: authUser.id,
        authorRole: authUser.role || "student",
        authorName: authUser.name || "Anonymous",
      },
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error("Error creating forum comment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
