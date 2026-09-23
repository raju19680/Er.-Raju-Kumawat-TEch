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
    const paymentPage = await db.paymentPage.findUnique({
      where: { id },
    })

    if (!paymentPage) {
      return NextResponse.json(
        { error: 'Payment page not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, item: paymentPage })
  } catch (error) {
    console.error('Failed to fetch payment page:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment page' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'payment_pages')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params
    const body = await request.json()

    const existing = await db.paymentPage.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Payment page not found' },
        { status: 404 }
      )
    }

    // Handle increment helpers
    const incrementViews = body.incrementViews
    const incrementPayments = body.incrementPayments

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

    const paymentPage = await db.paymentPage.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.amount !== undefined && { amount: body.amount }),
        ...(body.currency !== undefined && { currency: body.currency }),
        ...(body.buttonLabel !== undefined && { buttonLabel: body.buttonLabel }),
        ...(body.redirectUrl !== undefined && { redirectUrl: body.redirectUrl || null }),
        ...(body.customFields !== undefined && { customFields: body.customFields || null }),
        ...(body.template !== undefined && { template: body.template }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.slug !== undefined && { slug: body.slug || null }),
        ...(body.organizationId && { organizationId: orgId }),
        ...(incrementViews && { viewCount: { increment: 1 } }),
        ...(incrementPayments && { paymentCount: { increment: 1 } }),
      },
    })

    return NextResponse.json({ success: true, item: paymentPage })
  } catch (error) {
    console.error('Failed to update payment page:', error)
    return NextResponse.json(
      { error: 'Failed to update payment page' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'payment_pages')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params

    const existing = await db.paymentPage.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Payment page not found' },
        { status: 404 }
      )
    }

    await db.paymentPage.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Deleted' })
  } catch (error) {
    console.error('Failed to delete payment page:', error)
    return NextResponse.json(
      { error: 'Failed to delete payment page' },
      { status: 500 }
    )
  }
}

