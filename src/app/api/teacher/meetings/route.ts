export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'
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
        { title: { contains: search,  } },
        { hostName: { contains: search,  } },
        { platform: { contains: search,  } },
      ]
    }

    const [items, total] = await Promise.all([
      db.meeting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: 'desc' },
        include: {
          participants: true,
        },
      }),
      db.meeting.count({ where }),
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (error) {
    console.error('Failed to fetch meetings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessCheck = await checkModuleAccess(request, 'meetings')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const body = await request.json()

    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!body.startTime) {
      return NextResponse.json(
        { error: 'Start time is required' },
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

    const meeting = await db.meeting.create({
      data: {
        title: body.title,
        description: body.description || null,
        meetingLink: body.meetingLink || null,
        platform: body.platform || 'custom',
        startTime: new Date(body.startTime),
        endTime: body.endTime ? new Date(body.endTime) : null,
        duration: body.duration || 30,
        status: body.status || 'scheduled',
        hostName: body.hostName || null,
        participantCount: body.participantCount || 0,
        notes: body.notes || null,
        recordingUrl: body.recordingUrl || null,
        organizationId: orgId,
        participants: body.participants
          ? {
              create: body.participants.map((p: { name: string; email?: string; status?: string }) => ({
                name: p.name,
                email: p.email || null,
                status: p.status || 'invited',
              })),
            }
          : undefined,
      },
      include: {
        participants: true,
      },
    })

    return NextResponse.json({ success: true, item: meeting }, { status: 201 })
  } catch (error) {
    console.error('Failed to create meeting:', error)
    return NextResponse.json(
      { error: 'Failed to create meeting' },
      { status: 500 }
    )
  }
}

