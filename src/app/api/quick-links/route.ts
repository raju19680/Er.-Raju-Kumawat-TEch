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
    const skip = (page - 1) * limit

    const orgId = await resolveOrgId(request, organizationId)

    const where: Record<string, unknown> = {}

    if (orgId) {
      where.organizationId = orgId
    }

    if (search) {
      where.OR = [
        { title: { contains: search,  } },
        { url: { contains: search,  } },
      ]
    }

    const [items, total] = await Promise.all([
      db.quickLink.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
      }),
      db.quickLink.count({ where }),
    ])

    return NextResponse.json({ success: true, items, quickLinks: items, total, page, limit })
  } catch (error) {
    console.error('Failed to fetch quick links:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quick links' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessCheck = await checkModuleAccess(request, 'settings')
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

    if (!body.url) {
      return NextResponse.json(
        { error: 'URL is required' },
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

    const quickLink = await db.quickLink.create({
      data: {
        title: body.title,
        url: body.url,
        icon: body.icon || null,
        sortOrder: body.sortOrder || 0,
        organizationId: orgId,
      },
    })

    return NextResponse.json({ success: true, item: quickLink }, { status: 201 })
  } catch (error) {
    console.error('Failed to create quick link:', error)
    return NextResponse.json(
      { error: 'Failed to create quick link' },
      { status: 500 }
    )
  }
}
