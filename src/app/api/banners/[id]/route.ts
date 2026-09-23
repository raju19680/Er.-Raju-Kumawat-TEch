import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const banner = await db.banner.findUnique({
      where: { id },
    })

    if (!banner) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, item: banner })
  } catch (error) {
    console.error('Failed to fetch banner:', error)
    return NextResponse.json(
      { error: 'Failed to fetch banner' },
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

    const existing = await db.banner.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Banner not found' },
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

    const banner = await db.banner.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.image !== undefined && { image: body.image }),
        ...(body.mobileImage !== undefined && { mobileImage: body.mobileImage || null }),
        ...(body.link !== undefined && { link: body.link || null }),
        ...(body.position !== undefined && { position: body.position }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.startDate !== undefined && { startDate: body.startDate ? new Date(body.startDate) : null }),
        ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
        ...(body.organizationId && { organizationId: orgId }),
      },
    })

    return NextResponse.json({ success: true, item: banner })
  } catch (error) {
    console.error('Failed to update banner:', error)
    return NextResponse.json(
      { error: 'Failed to update banner' },
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

    const existing = await db.banner.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      )
    }

    await db.banner.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Deleted' })
  } catch (error) {
    console.error('Failed to delete banner:', error)
    return NextResponse.json(
      { error: 'Failed to delete banner' },
      { status: 500 }
    )
  }
}
