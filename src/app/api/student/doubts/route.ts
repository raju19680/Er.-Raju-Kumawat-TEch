import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    const student = await db.student.findFirst({
      where: {
        OR: [
          { userId: auth.id },
          { email: auth.email }
        ]
      }
    })

    const studentEmail = student?.email || auth.email
    const organizationId = student?.organizationId || auth.orgId

    const doubts = await db.supportQuery.findMany({
      where: {
        organizationId: organizationId || '',
        studentEmail: studentEmail || '',
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
    const auth = await getAuthUser(req)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    const student = await db.student.findFirst({
      where: {
        OR: [
          { userId: auth.id },
          { email: auth.email }
        ]
      }
    })

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
        studentName: student?.name || auth.name || 'Student',
        studentEmail: student?.email || auth.email || '',
        organizationId: student?.organizationId || auth.orgId || '',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Doubt submitted successfully! Your instructor will respond shortly.',
      doubt: newQuery,
    }, { status: 201 })
  } catch (error) {
    console.error('Submit doubt error:', error)
    return NextResponse.json({ success: false, message: 'Failed to submit doubt' }, { status: 500 })
  }
}
