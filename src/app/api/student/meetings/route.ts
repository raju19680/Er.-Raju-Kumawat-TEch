import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveOrgId } from '@/lib/demo-org'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || ''
    const platform = searchParams.get('platform') || ''

    const orgId = await resolveOrgId(request)
    if (!orgId) {
      return NextResponse.json(
        { success: false, message: 'Organization context required' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = {
      organizationId: orgId,
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (platform && platform !== 'all') {
      where.platform = platform
    }

    const meetings = await db.meeting.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { startTime: 'desc' },
      ],
      include: {
        _count: {
          select: { participants: true },
        },
      },
    })

    const formattedMeetings = meetings.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      meetingLink: m.meetingLink,
      platform: m.platform,
      startTime: m.startTime.toISOString(),
      endTime: m.endTime ? m.endTime.toISOString() : null,
      duration: m.duration,
      status: m.status,
      hostName: m.hostName || 'Instructor',
      participantCount: m.participantCount || m._count.participants,
      notes: m.notes,
      recordingUrl: m.recordingUrl,
      createdAt: m.createdAt.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      meetings: formattedMeetings,
    })
  } catch (error) {
    console.error('Failed to fetch student meetings:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch live classes' },
      { status: 500 }
    )
  }
}
