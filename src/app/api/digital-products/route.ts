import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const category = searchParams.get('category') || ''
    const organizationId = searchParams.get('organizationId') || ''
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    // Filter by organization
    if (organizationId) {
      // Check if it's a code (short) or an ID (cuid)
      if (organizationId.length < 20) {
        const org = await db.organization.findUnique({
          where: { code: organizationId },
          select: { id: true },
        })
        if (org) {
          where.organizationId = org.id
        }
      } else {
        where.organizationId = organizationId
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search,  } },
        { description: { contains: search,  } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    if (category) {
      where.category = category
    }

    const [items, total] = await Promise.all([
      db.digitalProduct.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.digitalProduct.count({ where }),
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (error) {
    console.error('Failed to fetch digital products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch digital products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check module access for teachers
    const accessCheck = await checkModuleAccess(request, 'courses')
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

    // Resolve orgCode to orgId
    let orgId = body.organizationId
    if (body.organizationId.length < 20) {
      const org = await db.organization.findUnique({
        where: { code: body.organizationId },
        select: { id: true },
      })
      orgId = org?.id || body.organizationId
    }

    const product = await db.digitalProduct.create({
      data: {
        title: body.title,
        description: body.description || null,
        thumbnail: body.thumbnail || null,
        file: body.file || null,
        type: body.type || 'course',
        category: body.category || null,
        price: body.price ?? 0,
        mrp: body.mrp ?? 0,
        status: body.status || 'draft',
        featured: body.featured ?? false,
        organizationId: orgId,
      },
    })

    return NextResponse.json({ success: true, product }, { status: 201 })
  } catch (error) {
    console.error('Failed to create digital product:', error)
    return NextResponse.json(
      { error: 'Failed to create digital product' },
      { status: 500 }
    )
  }
}
