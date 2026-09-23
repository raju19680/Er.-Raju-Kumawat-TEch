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

    const { searchParams } = req.nextUrl

    // Find the forum for this course
    const forum = await db.forum.findFirst({
      where: { courseId },
    })

    if (!forum) {
      return NextResponse.json({ success: true, posts: [] })
    }

    const lessonId = searchParams.get('lessonId')
    const where: Record<string, unknown> = { forumId: forum.id }
    if (lessonId) where.lessonId = lessonId

    const posts = await db.forumPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        _count: { select: { comments: true } },
      },
    })

    return NextResponse.json({ success: true, posts })
  } catch (error) {
    console.error('Forum GET Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch posts' }, { status: 500 })
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
    const { content, lessonId, title } = body

    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 })
    }

    // Find or create forum for this course
    let forum = await db.forum.findFirst({ where: { courseId } })
    if (!forum) {
      forum = await db.forum.create({ data: { courseId } })
    }

    const post = await db.forumPost.create({
      data: {
        title: title?.trim() || 'Question',
        content: content.trim(),
        forumId: forum.id,
        lessonId: lessonId || null,
        authorId: student.id,
        authorName: student.name,
        authorRole: 'student',
      },
    })

    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error('Forum POST Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to post' }, { status: 500 })
  }
}
