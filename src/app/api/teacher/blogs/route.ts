export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'
import { resolveOrgId } from '@/lib/demo-org'

// resolveOrgId imported from demo-org

export async function GET(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'blogs')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const orgId = await resolveOrgId(request, searchParams.get('organizationId') || undefined)

    const where: Record<string, unknown> = { organizationId: orgId }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
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

    return NextResponse.json({ items, total })
  } catch (error) {
    console.error('Failed to fetch blogs:', error)
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'blogs')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const orgId = await resolveOrgId(request, body.organizationId)

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
    return NextResponse.json({ error: 'Failed to create blog' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'blogs')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()
    if (!body.id) {
      return NextResponse.json({ error: 'Blog ID is required' }, { status: 400 })
    }

    const existing = await db.blog.findUnique({ where: { id: body.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (body.title !== undefined) data.title = body.title
    if (body.content !== undefined) data.content = body.content
    if (body.excerpt !== undefined) data.excerpt = body.excerpt
    if (body.thumbnail !== undefined) data.thumbnail = body.thumbnail
    if (body.tags !== undefined) data.tags = body.tags
    if (body.status !== undefined) data.status = body.status

    const blog = await db.blog.update({
      where: { id: body.id },
      data,
    })

    return NextResponse.json({ success: true, blog })
  } catch (error) {
    console.error('Failed to update blog:', error)
    return NextResponse.json({ error: 'Failed to update blog' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'blogs')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Blog ID is required' }, { status: 400 })
    }

    const existing = await db.blog.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    }

    await db.blog.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete blog:', error)
    return NextResponse.json({ error: 'Failed to delete blog' }, { status: 500 })
  }
}

