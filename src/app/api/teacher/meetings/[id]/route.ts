export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'
import { resolveOrgId } from '@/lib/demo-org'

// Using imported resolveOrgId from demo-org

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const meeting = await db.meeting.findUnique({
      where: { id },
      include: {
        participants: true,
      },
    })

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, item: meeting })
  } catch (error) {
    console.error('Failed to fetch meeting:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meeting' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'meetings')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params
    const body = await request.json()

    const existing = await db.meeting.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    let orgId = existing.organizationId
    if (body.organizationId) {
      orgId = await resolveOrgId(request, body.organizationId)
    }

    const meeting = await db.meeting.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.meetingLink !== undefined && { meetingLink: body.meetingLink || null }),
        ...(body.platform !== undefined && { platform: body.platform }),
        ...(body.startTime !== undefined && { startTime: new Date(body.startTime) }),
        ...(body.endTime !== undefined && { endTime: body.endTime ? new Date(body.endTime) : null }),
        ...(body.duration !== undefined && { duration: body.duration }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.hostName !== undefined && { hostName: body.hostName || null }),
        ...(body.participantCount !== undefined && { participantCount: body.participantCount }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
        ...(body.recordingUrl !== undefined && { recordingUrl: body.recordingUrl || null }),
        ...(body.organizationId && { organizationId: orgId }),
      },
      include: {
        participants: true,
      },
    })

    return NextResponse.json({ success: true, item: meeting })
  } catch (error) {
    console.error('Failed to update meeting:', error)
    return NextResponse.json(
      { error: 'Failed to update meeting' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'meetings')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params

    const existing = await db.meeting.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    await db.meeting.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Deleted' })
  } catch (error) {
    console.error('Failed to delete meeting:', error)
    return NextResponse.json(
      { error: 'Failed to delete meeting' },
      { status: 500 }
    )
  }
}

