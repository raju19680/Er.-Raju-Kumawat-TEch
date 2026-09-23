import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const blog = await db.blog.findUnique({
      where: { id },
    })

    if (!blog) {
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, blog })
  } catch (error) {
    console.error('Failed to fetch blog:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'blogs')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Verify blog exists
    const existing = await db.blog.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Blog not found' },
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

    const blog = await db.blog.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.content !== undefined && { content: body.content || null }),
        ...(body.excerpt !== undefined && { excerpt: body.excerpt || null }),
        ...(body.thumbnail !== undefined && { thumbnail: body.thumbnail || null }),
        ...(body.tags !== undefined && { tags: body.tags || null }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.organizationId && { organizationId: orgId }),
      },
    })

    return NextResponse.json({ success: true, blog })
  } catch (error) {
    console.error('Failed to update blog:', error)
    return NextResponse.json(
      { error: 'Failed to update blog' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'blogs')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params

    // Verify blog exists
    const existing = await db.blog.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      )
    }

    await db.blog.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Blog deleted' })
  } catch (error) {
    console.error('Failed to delete blog:', error)
    return NextResponse.json(
      { error: 'Failed to delete blog' },
      { status: 500 }
    )
  }
}
