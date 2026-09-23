export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDemoOrgId } from '@/lib/demo-org'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'settings')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const orgId = await getDemoOrgId(request)

    const items = await db.category.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'settings')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()

    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const orgId = await getDemoOrgId(request)

    // Auto-generate slug from name
    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    // Check for duplicate slug
    const existing = await db.category.findFirst({
      where: { slug, organizationId: orgId },
    })

    if (existing) {
      return NextResponse.json({ error: 'A category with this slug already exists' }, { status: 400 })
    }

    const category = await db.category.create({
      data: {
        name: body.name,
        slug,
        icon: body.icon || null,
        organizationId: orgId,
      },
    })

    return NextResponse.json({ success: true, category }, { status: 201 })
  } catch (error) {
    console.error('Failed to create category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, slug, icon } = body

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    const existing = await db.category.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Check for duplicate slug (exclude current)
    if (slug !== undefined) {
      const duplicate = await db.category.findFirst({
        where: { slug, id: { not: id } },
      })
      if (duplicate) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
      }
    }

    const category = await db.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(icon !== undefined && { icon: icon || null }),
      },
    })

    return NextResponse.json({ success: true, category })
  } catch (error) {
    console.error('Failed to update category:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    const existing = await db.category.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    await db.category.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Category deleted' })
  } catch (error) {
    console.error('Failed to delete category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}

