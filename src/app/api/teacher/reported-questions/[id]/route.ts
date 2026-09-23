export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'tests')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id } = await params
    const body = await request.json()

    // Verify reported question exists
    const existing = await db.reportedQuestion.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Reported question not found' }, { status: 404 })
    }

    const updated = await db.reportedQuestion.update({
      where: { id },
      data: {
        status: body.status || 'resolved',
      },
    })

    return NextResponse.json({ success: true, item: updated })
  } catch (error) {
    console.error('Failed to update reported question:', error)
    return NextResponse.json({ error: 'Failed to update reported question' }, { status: 500 })
  }
}

