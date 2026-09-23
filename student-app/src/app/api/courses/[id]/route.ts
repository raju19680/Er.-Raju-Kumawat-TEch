import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const course = await db.course.findUnique({
      where: { id },
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, course })
  } catch (error) {
    console.error('Failed to fetch course:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course' },
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

    // Verify course exists
    const existing = await db.course.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Course not found' },
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

    const course = await db.course.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.thumbnail !== undefined && { thumbnail: body.thumbnail || null }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.mrp !== undefined && { mrp: body.mrp }),
        ...(body.category !== undefined && { category: body.category || null }),
        ...(body.content !== undefined && { content: body.content || null }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.organizationId && { organizationId: orgId }),
      },
    })

    return NextResponse.json({ success: true, course })
  } catch (error) {
    console.error('Failed to update course:', error)
    return NextResponse.json(
      { error: 'Failed to update course' },
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

    // Verify course exists
    const existing = await db.course.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    await db.course.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Course deleted' })
  } catch (error) {
    console.error('Failed to delete course:', error)
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    )
  }
}
