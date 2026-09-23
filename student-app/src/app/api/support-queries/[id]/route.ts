import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supportQuery = await db.supportQuery.findUnique({
      where: { id },
    })

    if (!supportQuery) {
      return NextResponse.json(
        { error: 'Support query not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, item: supportQuery })
  } catch (error) {
    console.error('Failed to fetch support query:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support query' },
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

    const existing = await db.supportQuery.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Support query not found' },
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

    const supportQuery = await db.supportQuery.update({
      where: { id },
      data: {
        ...(body.subject !== undefined && { subject: body.subject }),
        ...(body.message !== undefined && { message: body.message }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.studentName !== undefined && { studentName: body.studentName || null }),
        ...(body.studentEmail !== undefined && { studentEmail: body.studentEmail || null }),
        ...(body.organizationId && { organizationId: orgId }),
      },
    })

    return NextResponse.json({ success: true, item: supportQuery })
  } catch (error) {
    console.error('Failed to update support query:', error)
    return NextResponse.json(
      { error: 'Failed to update support query' },
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

    const existing = await db.supportQuery.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Support query not found' },
        { status: 404 }
      )
    }

    await db.supportQuery.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Deleted' })
  } catch (error) {
    console.error('Failed to delete support query:', error)
    return NextResponse.json(
      { error: 'Failed to delete support query' },
      { status: 500 }
    )
  }
}
