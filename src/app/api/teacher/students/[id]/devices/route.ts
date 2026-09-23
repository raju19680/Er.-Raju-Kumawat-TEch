export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'students')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id: studentId } = await params
    const body = await request.json()
    const { sessionId, isActive } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    const device = await db.deviceSession.findUnique({ where: { id: sessionId } })
    if (!device || device.studentId !== studentId) {
      return NextResponse.json({ error: 'Device session not found' }, { status: 404 })
    }

    const updated = await db.deviceSession.update({
      where: { id: sessionId },
      data: { isActive }
    })

    return NextResponse.json({ success: true, message: isActive ? 'Device unlocked' : 'Device locked/logged out', device: updated })
  } catch (error) {
    console.error('Failed to update device session:', error)
    return NextResponse.json({ error: 'Failed to update device' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'students')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id: studentId } = await params
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    const device = await db.deviceSession.findUnique({ where: { id: sessionId } })
    if (!device || device.studentId !== studentId) {
      return NextResponse.json({ error: 'Device session not found' }, { status: 404 })
    }

    await db.deviceSession.delete({ where: { id: sessionId } })

    return NextResponse.json({ success: true, message: 'Device session removed' })
  } catch (error) {
    console.error('Failed to delete device session:', error)
    return NextResponse.json({ error: 'Failed to delete device' }, { status: 500 })
  }
}

