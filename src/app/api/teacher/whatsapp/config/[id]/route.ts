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
    const config = await db.whatsAppConfig.findUnique({
      where: { id },
    })

    if (!config) {
      return NextResponse.json(
        { error: 'WhatsApp config not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, item: config })
  } catch (error) {
    console.error('Failed to fetch WhatsApp config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch WhatsApp config' },
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

    const existing = await db.whatsAppConfig.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'WhatsApp config not found' },
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

    const config = await db.whatsAppConfig.update({
      where: { id },
      data: {
        ...(body.phoneNumber !== undefined && { phoneNumber: body.phoneNumber }),
        ...(body.displayName !== undefined && { displayName: body.displayName || null }),
        ...(body.apiKey !== undefined && { apiKey: body.apiKey || null }),
        ...(body.webhookUrl !== undefined && { webhookUrl: body.webhookUrl || null }),
        ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.organizationId && { organizationId: orgId }),
      },
    })

    return NextResponse.json({ success: true, item: config })
  } catch (error) {
    console.error('Failed to update WhatsApp config:', error)
    return NextResponse.json(
      { error: 'Failed to update WhatsApp config' },
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

    const existing = await db.whatsAppConfig.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'WhatsApp config not found' },
        { status: 404 }
      )
    }

    await db.whatsAppConfig.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Deleted' })
  } catch (error) {
    console.error('Failed to delete WhatsApp config:', error)
    return NextResponse.json(
      { error: 'Failed to delete WhatsApp config' },
      { status: 500 }
    )
  }
}

