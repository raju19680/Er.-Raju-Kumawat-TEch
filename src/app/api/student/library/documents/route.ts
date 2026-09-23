import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const student = await db.student.findFirst({
      where: {
        OR: [
          { userId: auth.id },
          { email: auth.email }
        ]
      }
    })

    const orgId = student?.organizationId || auth.orgId || ''

    const documents = await db.document.findMany({
      where: {
        organizationId: orgId,
        isPublic: true,
        status: 'active',
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      documents,
    })
  } catch (error) {
    console.error('Failed to fetch student library documents:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch library' }, { status: 500 })
  }
}
