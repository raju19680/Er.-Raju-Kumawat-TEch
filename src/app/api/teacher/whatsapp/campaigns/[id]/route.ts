export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const campaign = await db.whatsAppCampaign.findUnique({
      where: { id },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'WhatsApp campaign not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, item: campaign })
  } catch (error) {
    console.error('Failed to fetch WhatsApp campaign:', error)
    return NextResponse.json(
      { error: 'Failed to fetch WhatsApp campaign' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'whatsapp')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params
    const body = await request.json()

    const existing = await db.whatsAppCampaign.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'WhatsApp campaign not found' },
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

    const campaign = await db.whatsAppCampaign.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.message !== undefined && { message: body.message }),
        ...(body.templateName !== undefined && { templateName: body.templateName || null }),
        ...(body.targetAudience !== undefined && { targetAudience: body.targetAudience }),
        ...(body.targetFilter !== undefined && { targetFilter: body.targetFilter || null }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.totalRecipients !== undefined && { totalRecipients: body.totalRecipients }),
        ...(body.deliveredCount !== undefined && { deliveredCount: body.deliveredCount }),
        ...(body.readCount !== undefined && { readCount: body.readCount }),
        ...(body.repliedCount !== undefined && { repliedCount: body.repliedCount }),
        ...(body.failedCount !== undefined && { failedCount: body.failedCount }),
        ...(body.scheduledAt !== undefined && { scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null }),
        ...(body.sentAt !== undefined && { sentAt: body.sentAt ? new Date(body.sentAt) : null }),
        ...(body.organizationId && { organizationId: orgId }),
      },
    })

    return NextResponse.json({ success: true, item: campaign })
  } catch (error) {
    console.error('Failed to update WhatsApp campaign:', error)
    return NextResponse.json(
      { error: 'Failed to update WhatsApp campaign' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'whatsapp')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params

    const existing = await db.whatsAppCampaign.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'WhatsApp campaign not found' },
        { status: 404 }
      )
    }

    await db.whatsAppCampaign.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Deleted' })
  } catch (error) {
    console.error('Failed to delete WhatsApp campaign:', error)
    return NextResponse.json(
      { error: 'Failed to delete WhatsApp campaign' },
      { status: 500 }
    )
  }
}

