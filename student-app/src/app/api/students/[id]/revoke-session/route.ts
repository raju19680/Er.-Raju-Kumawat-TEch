import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'dashboard')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Verify the device session belongs to this student
    const deviceSession = await db.deviceSession.findUnique({
      where: { id: sessionId },
    })

    if (!deviceSession || deviceSession.studentId !== id) {
      return NextResponse.json(
        { error: 'Device session not found' },
        { status: 404 }
      )
    }

    // Revoke the session by setting isActive to false and logoutAt
    await db.deviceSession.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        logoutAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Device session revoked successfully',
    })
  } catch (error) {
    console.error('Failed to revoke device session:', error)
    return NextResponse.json(
      { error: 'Failed to revoke device session' },
      { status: 500 }
    )
  }
}
