import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()

    const meeting = await db.meeting.findUnique({
      where: { id },
    })

    if (!meeting) {
      return NextResponse.json(
        { success: false, message: 'Meeting not found' },
        { status: 404 }
      )
    }

    const studentName = session?.name || 'Student'
    const studentEmail = session?.email || null

    // Record participant join
    await db.meetingParticipant.create({
      data: {
        meetingId: id,
        name: studentName,
        email: studentEmail,
        status: 'joined',
        joinedAt: new Date(),
      },
    })

    // Increment participant count
    await db.meeting.update({
      where: { id },
      data: {
        participantCount: { increment: 1 },
      },
    })

    return NextResponse.json({
      success: true,
      meetingLink: meeting.meetingLink,
      message: 'Joined meeting successfully',
    })
  } catch (error) {
    console.error('Failed to join meeting:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to record meeting join' },
      { status: 500 }
    )
  }
}
