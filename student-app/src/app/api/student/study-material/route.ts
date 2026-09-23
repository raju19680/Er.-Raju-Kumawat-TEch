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
      // Try default org
      const defaultOrg = await db.organization.findFirst({
        where: { code: process.env.NEXT_PUBLIC_DEFAULT_ORG_CODE || 'ERKTACADEMY' },
        select: { id: true }
      }).catch(() => null)
      orgId = defaultOrg?.id
    }

    const where: Record<string, unknown> = {}
    if (orgId) where.organizationId = orgId
    if (category && category !== 'all') where.category = category
    if (search) where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ]

    const documents = await db.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    }).catch(() => [])

    const categories = Array.from(new Set(documents.map((d: any) => d.category).filter(Boolean)))

    return NextResponse.json({
      success: true,
      studyMaterials: documents,
      materials: documents,
      documents,
      categories,
    })
  } catch (error) {
    console.error('Fetch study materials error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch study materials', studyMaterials: [], materials: [], documents: [] },
      { status: 200 } // Return 200 so UI doesn't break
    )
  }
}
