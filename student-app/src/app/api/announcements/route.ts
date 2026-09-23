import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import { resolveOrgId } from '@/lib/demo-org'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req)
    const { searchParams } = new URL(req.url)
    const orgQuery = searchParams.get('organizationId') || searchParams.get('org') || searchParams.get('orgCode') || ''

    const orgId = auth ? auth.orgId : await resolveOrgId(req, orgQuery)

    const where: Record<string, unknown> = {
      isActive: true,
      targetRole: { in: ['all', 'student'] },
    }

    const announcements = await db.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ success: true, announcements, items: announcements })
  } catch (error) {
    console.error('Student app get announcements error:', error)
    return NextResponse.json({ success: false, message: 'Failed to load announcements' }, { status: 500 })
  }
}
