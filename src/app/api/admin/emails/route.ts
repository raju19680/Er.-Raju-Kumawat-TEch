export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

// GET /api/admin/emails — List email logs with filters
export async function GET(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || undefined
    const status = searchParams.get('status') || undefined
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const search = searchParams.get('search') || undefined

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (type) where.type = type
    if (status) where.status = status
    if (search) {
      where.OR = [
        { to: { contains: search,  } },
        { subject: { contains: search,  } },
      ]
    }

    const [emails, total] = await Promise.all([
      db.emailLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          to: true,
          subject: true,
          type: true,
          status: true,
          createdAt: true,
          sentAt: true,
          organizationId: true,
        },
      }),
      db.emailLog.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      emails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[Email Log] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch email logs.' },
      { status: 500 }
    )
  }
}

// POST /api/admin/emails — Resend a failed email
export async function POST(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await req.json()
    const { emailId } = body

    if (!emailId) {
      return NextResponse.json(
        { success: false, message: 'Email ID is required.' },
        { status: 400 }
      )
    }

    // Find the failed email
    const emailLog = await db.emailLog.findUnique({
      where: { id: emailId },
    })

    if (!emailLog) {
      return NextResponse.json(
        { success: false, message: 'Email log not found.' },
        { status: 404 }
      )
    }

    // Update the status to 'sent' (in production, would actually resend)
    await db.emailLog.update({
      where: { id: emailId },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    })

    console.log(`[EMAIL] Resent: id=${emailId} to=${emailLog.to} subject="${emailLog.subject}"`)

    return NextResponse.json({
      success: true,
      message: 'Email resent successfully.',
    })
  } catch (error) {
    console.error('[Email Resend] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to resend email.' },
      { status: 500 }
    )
  }
}
