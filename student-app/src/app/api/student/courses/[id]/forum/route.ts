
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    
    const { id: courseId } = await params
    
    let forum = await db.forum.findUnique({
      where: { courseId },
      include: {
        posts: {
          include: {
            
            comments: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })
    
    if (!forum) {
      forum = await db.forum.create({
        data: { courseId },
        include: { posts: { include: { comments: true } } }
      })
    }
    
    return NextResponse.json({ success: true, posts: forum.posts })
  } catch (error) {
    console.error('Forum GET Error:', error)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    
    const { id: courseId } = await params
    const { title, content } = await req.json()
    
    let forum = await db.forum.findUnique({ where: { courseId } })
    if (!forum) {
      forum = await db.forum.create({ data: { courseId } })
    }
    
    const student = await db.student.findFirst({ where: { userId: auth.id } })
    
    const post = await db.forumPost.create({
      data: {
        forumId: forum.id,
        authorId: student?.id || auth.id,
        authorName: student?.name || auth.name || 'Student',
        authorRole: 'student',
        title: title || 'Post',
        content
      }
    })
    
    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error('Forum POST Error:', error)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}
