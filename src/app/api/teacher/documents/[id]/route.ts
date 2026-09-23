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
    const document = await db.document.findUnique({
      where: { id },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, item: document })
  } catch (error) {
    console.error('Failed to fetch document:', error)
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'documents')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params
    const body = await request.json()

    const existing = await db.document.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    let orgId = existing.organizationId
    if (body.organizationId) {
      orgId = await resolveOrgId(request, body.organizationId)
    }

    const document = await db.document.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.fileUrl !== undefined && { fileUrl: body.fileUrl || null }),
        ...(body.fileType !== undefined && { fileType: body.fileType }),
        ...(body.fileSize !== undefined && { fileSize: body.fileSize }),
        ...(body.category !== undefined && { category: body.category || null }),
        ...(body.tags !== undefined && { tags: body.tags || null }),
        ...(body.downloadCount !== undefined && { downloadCount: body.downloadCount }),
        ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.organizationId && { organizationId: orgId }),
      },
    })

    return NextResponse.json({ success: true, item: document })
  } catch (error) {
    console.error('Failed to update document:', error)
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'documents')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params

    const existing = await db.document.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    await db.document.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Deleted' })
  } catch (error) {
    console.error('Failed to delete document:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}

