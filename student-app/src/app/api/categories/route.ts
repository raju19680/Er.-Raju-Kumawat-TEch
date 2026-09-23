import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const organizationId = searchParams.get('organizationId') || ''

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
      ]
    }

    if (organizationId) {
      where.organizationId = organizationId
    }

    const items = await db.category.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check module access for teachers (categories are part of settings)
    const accessCheck = await checkModuleAccess(request, 'settings')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const body = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    if (!body.slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      )
    }

    if (!body.organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Check for duplicate slug
    const existing = await db.category.findFirst({
      where: {
        slug: body.slug,
        organizationId: body.organizationId,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A category with this slug already exists' },
        { status: 400 }
      )
    }

    const category = await db.category.create({
      data: {
        name: body.name,
        slug: body.slug,
        icon: body.icon || null,
        organizationId: body.organizationId,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Failed to create category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
