import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const doubts = await db.supportQuery.findMany({
      where: {
        organizationId: auth.orgId,
        studentEmail: student.email,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      doubts,
    })
  } catch (error) {
    console.error('Student doubts fetch error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const body = await req.json()
    const subject = body.subject || body.title
    const message = body.message || body.description || body.text || ''

    if (!subject || !message) {
      return NextResponse.json(
        { success: false, message: 'Subject and message are required' },
        { status: 400 }
      )
    }

    const newQuery = await db.supportQuery.create({
      data: {
        subject,
        message,
        status: 'open',
        studentName: student.name,
        studentEmail: student.email,
        organizationId: auth.orgId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Doubt query submitted successfully! Your instructor will respond shortly.',
      doubt: newQuery,
    }, { status: 201 })
  } catch (error) {
    console.error('Submit doubt error:', error)
    return NextResponse.json({ success: false, message: 'Failed to submit doubt query' }, { status: 500 })
  }
}
