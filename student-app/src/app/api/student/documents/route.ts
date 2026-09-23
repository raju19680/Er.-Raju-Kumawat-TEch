import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req)
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    let orgId = auth?.orgId
    if (!orgId) {
      const defaultOrg = await db.organization.findFirst({
        where: { code: process.env.NEXT_PUBLIC_DEFAULT_ORG_CODE || 'ERKTACADEMY' },
        select: { id: true }
      })
      orgId = defaultOrg?.id
    }

    const where: any = {
      status: 'active',
    }
    if (orgId) {
      where.organizationId = orgId
    }
    if (category && category !== 'all') {
      where.category = category
    }
    if (search) {
      where.title = { contains: search, mode: 'insensitive' }
    }

    const documents = await db.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Get distinct categories
    const categories = Array.from(new Set(documents.map(d => d.category).filter(Boolean)))

    return NextResponse.json({
      success: true,
      documents,
      categories,
    })
  } catch (error) {
    console.error('Fetch student documents error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}
