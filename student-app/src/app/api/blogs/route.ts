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
    const status = searchParams.get('status') || ''
    const tag = searchParams.get('tag') || ''
    const organizationId = searchParams.get('organizationId') || ''
    const skip = (page - 1) * limit

    // Resolve orgCode to actual orgId
    const orgId = await resolveOrgId(request, organizationId)

    const where: Record<string, unknown> = {}

    if (orgId) {
      where.organizationId = orgId
    }

    if (status) {
      where.status = status
    }

    if (tag) {
      where.tags = { contains: tag }
    }

    if (search) {
      where.OR = [
        { title: { contains: search,  } },
        { excerpt: { contains: search,  } },
      ]
    }

    const [items, total] = await Promise.all([
      db.blog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.blog.count({ where }),
    ])

    return NextResponse.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Failed to fetch blogs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blogs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check module access for teachers
    const accessCheck = await checkModuleAccess(request, 'blogs')
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

    if (!body.organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Resolve orgCode to orgId for the organizationId field
    const orgId = await resolveOrgId(request, body.organizationId || '')

    const blog = await db.blog.create({
      data: {
        title: body.title,
        content: body.content || null,
        excerpt: body.excerpt || null,
        thumbnail: body.thumbnail || null,
        tags: body.tags || null,
        status: body.status || 'draft',
        organizationId: orgId,
      },
    })

    return NextResponse.json({ success: true, blog }, { status: 201 })
  } catch (error) {
    console.error('Failed to create blog:', error)
    return NextResponse.json(
      { error: 'Failed to create blog' },
      { status: 500 }
    )
  }
}
