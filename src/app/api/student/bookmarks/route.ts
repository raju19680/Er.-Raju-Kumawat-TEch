import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const bookmarks = await db.bookmark.findMany({
      where: {
        studentId: student.id,
        resourceType: 'question',
      },
      orderBy: { createdAt: 'desc' }
    })
    
    if (!bookmarks.length) {
      return NextResponse.json({ success: true, data: [] })
    }
    
    const questionIds = bookmarks.map(b => b.resourceId)
    
    const questions = await db.question.findMany({
      where: { id: { in: questionIds } },
      select: {
        id: true,
        title: true,
        section: true,
        type: true,
        positiveMarks: true,
        negativeMarks: true,
        option1: true,
        option2: true,
        option3: true,
        option4: true,
        option5: true,
        correctOption: true,
        solutionHeading: true,
        solutionText: true,
        test: {
          select: {
            id: true,
            title: true,
            showSolution: true,
          }
        }
      }
    })
    
    const qMap = new Map()
    questions.forEach(q => qMap.set(q.id, q))
    
    const data = bookmarks.map(b => ({
      ...b,
      question: qMap.get(b.resourceId) || null
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Bookmarks get error:', error)
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 })
  }
}
