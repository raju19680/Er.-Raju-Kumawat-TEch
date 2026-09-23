import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const coupon = await db.coupon.findUnique({
      where: { id },
    })

    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, item: coupon })
  } catch (error) {
    console.error('Failed to fetch coupon:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coupon' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'marketing')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params
    const body = await request.json()

    const existing = await db.coupon.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      )
    }

    // If code or organizationId is being changed, check for duplicates
    if (body.code || body.organizationId) {
      const checkCode = body.code || existing.code
      const checkOrgId = body.organizationId
        ? (body.organizationId.length < 20
            ? (await db.organization.findUnique({
                where: { code: body.organizationId },
                select: { id: true },
              }))?.id || body.organizationId
            : body.organizationId)
        : existing.organizationId

      const duplicate = await db.coupon.findFirst({
        where: {
          code: checkCode,
          organizationId: checkOrgId,
          id: { not: id },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'A coupon with this code already exists in this organization' },
          { status: 409 }
        )
      }
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

    const coupon = await db.coupon.update({
      where: { id },
      data: {
        ...(body.code !== undefined && { code: body.code }),
        ...(body.discount !== undefined && { discount: body.discount }),
        ...(body.discountType !== undefined && { discountType: body.discountType }),
        ...(body.minPurchaseAmount !== undefined && { minPurchaseAmount: body.minPurchaseAmount }),
        ...(body.applicableProductIds !== undefined && { applicableProductIds: body.applicableProductIds }),
        ...(body.maxUses !== undefined && { maxUses: body.maxUses }),
        ...(body.usedCount !== undefined && { usedCount: body.usedCount }),
        ...(body.validFrom !== undefined && { validFrom: body.validFrom ? new Date(body.validFrom) : null }),
        ...(body.validTo !== undefined && { validTo: body.validTo ? new Date(body.validTo) : null }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.organizationId && { organizationId: orgId }),
      },
    })

    return NextResponse.json({ success: true, item: coupon })
  } catch (error) {
    console.error('Failed to update coupon:', error)
    return NextResponse.json(
      { error: 'Failed to update coupon' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'marketing')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params

    const existing = await db.coupon.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      )
    }

    await db.coupon.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Deleted' })
  } catch (error) {
    console.error('Failed to delete coupon:', error)
    return NextResponse.json(
      { error: 'Failed to delete coupon' },
      { status: 500 }
    )
  }
}
