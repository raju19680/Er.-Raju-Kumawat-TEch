export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminOrTeacher } from '@/lib/auth-helpers'
import { getDemoOrgId } from '@/lib/demo-org'

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdminOrTeacher(req)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }
    const auth = authResult.user
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = await getDemoOrgId(req)
    const searchParams = req.nextUrl.searchParams
    const forumId = searchParams.get('forumId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Get forums belonging to this org's courses
    const orgForums = await db.forum.findMany({
      where: { course: { organizationId: orgId } },
      select: { id: true, courseId: true, course: { select: { title: true } } },
    })
    const forumIds = orgForums.map(f => f.id)

    const where: Record<string, unknown> = {
      forumId: forumId ? forumId : { in: forumIds }
    }

    const [posts, total] = await Promise.all([
      db.forumPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          forum: { select: { courseId: true, course: { select: { title: true } } } },
          _count: { select: { comments: true } },
        },
      }),
      db.forumPost.count({ where }),
    ])

    const enriched = posts.map(p => ({
      ...p,
      courseName: p.forum?.course?.title ?? null,
      replyCount: p._count.comments,
    }))

    return NextResponse.json({ success: true, posts: enriched, total, page, limit })
  } catch (error) {
    console.error('Discussions GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAdminOrTeacher(req)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }
    const auth = authResult.user
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { content, forumId, parentId } = body

    if (!content?.trim() || !forumId) {
      return NextResponse.json({ error: 'Content and forumId are required' }, { status: 400 })
    }

    const post = await db.forumPost.create({
      data: {
        title: body.title || 'Reply',
        content: content.trim(),
        forumId,
        authorId: auth.id,
        authorName: auth.name || 'Teacher',
        authorRole: 'teacher',
      },
    })

    // If parentId given, create a ForumComment instead
    if (parentId) {
      const comment = await db.forumComment.create({
        data: {
          content: content.trim(),
          postId: parentId,
          authorId: auth.id,
          authorName: auth.name || 'Teacher',
          authorRole: 'teacher',
        },
      })
      return NextResponse.json({ success: true, comment })
    }

    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error('Discussions POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireAdminOrTeacher(req)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }
    const auth = authResult.user
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const postId = searchParams.get('id')
    const commentId = searchParams.get('commentId')

    if (commentId) {
      await db.forumComment.delete({ where: { id: commentId } })
      return NextResponse.json({ success: true, message: 'Comment deleted' })
    }

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 })
    }

    await db.forumPost.delete({ where: { id: postId } })
    return NextResponse.json({ success: true, message: 'Post deleted' })
  } catch (error) {
    console.error('Discussions DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

