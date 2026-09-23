
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string, postId: string }> }) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    
    const comments = await db.forumComment.findMany({
      where: { postId: (await params).postId },
      
      orderBy: { createdAt: 'asc' }
    })
    
    return NextResponse.json(comments)
  } catch (error) {
    console.error('Comments GET Error:', error)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string, postId: string }> }) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    
    const { content } = await req.json()
    const student = await db.student.findFirst({ where: { userId: auth.id } })
    
    const comment = await db.forumComment.create({
      data: {
        postId: (await params).postId,
        authorId: student?.id || auth.id,
        authorName: student?.name || auth.name || 'Student',
        authorRole: 'student',
        content
      }
    })
    
    return NextResponse.json({ success: true, comment })
  } catch (error) {
    console.error('Comments POST Error:', error)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}
