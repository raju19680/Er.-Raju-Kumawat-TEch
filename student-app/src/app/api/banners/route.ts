import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'
import { resolveOrgId } from '@/lib/demo-org'

// Using imported resolveOrgId from demo-org

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const organizationId = searchParams.get('organizationId') || ''
    const isActive = searchParams.get('isActive') || ''
    const skip = (page - 1) * limit

    const orgId = await resolveOrgId(request, organizationId)

    const where: Record<string, unknown> = {}

    if (orgId) {
      where.organizationId = orgId
    }

    if (isActive !== '') {
      where.isActive = isActive === 'true'
    }

    if (search) {
      where.OR = [
        { title: { contains: search,  } },
      ]
    }

    const [items, total] = await Promise.all([
      db.banner.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
      }),
      db.banner.count({ where }),
    ])

    return NextResponse.json({ success: true, items, banners: items, total, page, limit })
  } catch (error) {
    console.error('Failed to fetch banners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch banners' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessCheck = await checkModuleAccess(request, 'marketing')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const body = await request.json()

    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!body.image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      )
    }

    if (!body.organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const orgId = await resolveOrgId(request, body.organizationId)

    const banner = await db.banner.create({
      data: {
        title: body.title,
        image: body.image,
        link: body.link || null,
        sortOrder: body.sortOrder || 0,
        isActive: body.isActive !== undefined ? body.isActive : true,
        organizationId: orgId,
      },
    })

    return NextResponse.json({ success: true, item: banner }, { status: 201 })
  } catch (error) {
    console.error('Failed to create banner:', error)
    return NextResponse.json(
      { error: 'Failed to create banner' },
      { status: 500 }
    )
  }
}
