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

    const posts = await prisma.forumPost.findMany({
      where: {
        forum: {
          courseId,
        },
      },
      include: {
        comments: {
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, posts })
  } catch (error) {
    console.error("Error fetching forum posts:", error)
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

    const { title, content } = await req.json()
    const authUser = await getAuthUser(req)
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Find or create forum
    let forum = await prisma.forum.findUnique({
      where: { courseId },
    })

    if (!forum) {
      forum = await prisma.forum.create({
        data: { courseId },
      })
    }

    const post = await prisma.forumPost.create({
      data: {
        title: title || "Untitled",
        content: content || "",
        forumId: forum.id,
        authorId: authUser.id,
        authorRole: authUser.role || "student",
        authorName: authUser.name || "Anonymous",
      },
      include: {
        comments: true,
      },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error("Error creating forum post:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
