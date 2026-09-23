import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const quickLink = await db.quickLink.findUnique({
      where: { id },
    })

    if (!quickLink) {
      return NextResponse.json(
        { error: 'Quick link not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, item: quickLink })
  } catch (error) {
    console.error('Failed to fetch quick link:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quick link' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'settings')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params
    const body = await request.json()

    const existing = await db.quickLink.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Quick link not found' },
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

    const quickLink = await db.quickLink.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.url !== undefined && { url: body.url }),
        ...(body.icon !== undefined && { icon: body.icon || null }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        ...(body.organizationId && { organizationId: orgId }),
      },
    })

    return NextResponse.json({ success: true, item: quickLink })
  } catch (error) {
    console.error('Failed to update quick link:', error)
    return NextResponse.json(
      { error: 'Failed to update quick link' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'settings')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params

    const existing = await db.quickLink.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Quick link not found' },
        { status: 404 }
      )
    }

    await db.quickLink.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Deleted' })
  } catch (error) {
    console.error('Failed to delete quick link:', error)
    return NextResponse.json(
      { error: 'Failed to delete quick link' },
      { status: 500 }
    )
  }
}
