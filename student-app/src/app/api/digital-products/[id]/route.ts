import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await db.digitalProduct.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Digital product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error('Failed to fetch digital product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch digital product' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'courses')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Verify product exists
    const existing = await db.digitalProduct.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Digital product not found' },
        { status: 404 }
      )
    }

    // Resolve orgCode to orgId if organizationId is provided
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

    const product = await db.digitalProduct.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.thumbnail !== undefined && { thumbnail: body.thumbnail || null }),
        ...(body.file !== undefined && { file: body.file || null }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.category !== undefined && { category: body.category || null }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.mrp !== undefined && { mrp: body.mrp }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.featured !== undefined && { featured: body.featured }),
        ...(body.organizationId && { organizationId: orgId }),
      },
    })

    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error('Failed to update digital product:', error)
    return NextResponse.json(
      { error: 'Failed to update digital product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'courses')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params

    // Verify product exists
    const existing = await db.digitalProduct.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Digital product not found' },
        { status: 404 }
      )
    }

    await db.digitalProduct.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Digital product deleted' })
  } catch (error) {
    console.error('Failed to delete digital product:', error)
    return NextResponse.json(
      { error: 'Failed to delete digital product' },
      { status: 500 }
    )
  }
}
