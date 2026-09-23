import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveOrgId } from '@/lib/demo-org'

// Using imported resolveOrgId from demo-org

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const organizationId = searchParams.get('organizationId') || ''
    const status = searchParams.get('status') || ''
    const skip = (page - 1) * limit

    const orgId = await resolveOrgId(request, organizationId)

    const where: Record<string, unknown> = {}

    if (orgId) {
      where.organizationId = orgId
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { subject: { contains: search,  } },
        { studentName: { contains: search,  } },
        { studentEmail: { contains: search,  } },
      ]
    }

    const [items, total] = await Promise.all([
      db.supportQuery.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.supportQuery.count({ where }),
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (error) {
    console.error('Failed to fetch support queries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support queries' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // No module access check - students can create support queries
    const body = await request.json()

    if (!body.subject) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      )
    }

    if (!body.message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (!body.organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const orgId = await resolveOrgId(request, body.organizationId)

    const supportQuery = await db.supportQuery.create({
      data: {
        subject: body.subject,
        message: body.message,
        status: body.status || 'open',
        studentName: body.studentName || null,
        studentEmail: body.studentEmail || null,
        organizationId: orgId,
      },
    })

    return NextResponse.json({ success: true, item: supportQuery }, { status: 201 })
  } catch (error) {
    console.error('Failed to create support query:', error)
    return NextResponse.json(
      { error: 'Failed to create support query' },
      { status: 500 }
    )
  }
}
