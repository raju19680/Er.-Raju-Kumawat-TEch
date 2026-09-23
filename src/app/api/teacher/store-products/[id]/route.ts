export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'
import { resolveOrgId } from '@/lib/demo-org'

// Using imported resolveOrgId from demo-org

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const storeProduct = await db.storeProduct.findUnique({
      where: { id },
    })

    if (!storeProduct) {
      return NextResponse.json(
        { error: 'Store product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, item: storeProduct })
  } catch (error) {
    console.error('Failed to fetch store product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch store product' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'store')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params
    const body = await request.json()

    const existing = await db.storeProduct.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Store product not found' },
        { status: 404 }
      )
    }

    let orgId = existing.organizationId
    if (body.organizationId) {
      if (body.organizationId.length < 20) {
        const org = await db.organization.findUnique({
          where: { code: body.organizationId },
          select: { id: true },
        })
        orgId = org?.id || body.organizationId
      } else {
        orgId = body.organizationId
      }
    }

    const storeProduct = await db.storeProduct.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.thumbnail !== undefined && { thumbnail: body.thumbnail || null }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.mrp !== undefined && { mrp: body.mrp }),
        ...(body.category !== undefined && { category: body.category || null }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.stock !== undefined && { stock: body.stock }),
        ...(body.soldCount !== undefined && { soldCount: body.soldCount }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.featured !== undefined && { featured: body.featured }),
        ...(body.organizationId && { organizationId: orgId }),
      },
    })

    return NextResponse.json({ success: true, item: storeProduct })
  } catch (error) {
    console.error('Failed to update store product:', error)
    return NextResponse.json(
      { error: 'Failed to update store product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'store')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params

    const existing = await db.storeProduct.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Store product not found' },
        { status: 404 }
      )
    }

    await db.storeProduct.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Deleted' })
  } catch (error) {
    console.error('Failed to delete store product:', error)
    return NextResponse.json(
      { error: 'Failed to delete store product' },
      { status: 500 }
    )
  }
}

