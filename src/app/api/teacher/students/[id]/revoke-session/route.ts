export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(req, 'students')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id } = await params
    await db.deviceSession.updateMany({
      where: { studentId: id, isActive: true },
      data: { isActive: false, logoutAt: new Date() },
    })

    return NextResponse.json({ success: true, message: 'Sessions revoked' })
  } catch (error) {
    console.error('Revoke session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

