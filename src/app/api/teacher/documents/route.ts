export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'
import { resolveOrgId } from '@/lib/demo-org'

// Using imported resolveOrgId from demo-org

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const organizationId = searchParams.get('organizationId') || ''
    const status = searchParams.get('status') || ''
    const category = searchParams.get('category') || ''
    const fileType = searchParams.get('fileType') || ''
    const skip = (page - 1) * limit

    const orgId = await resolveOrgId(request, organizationId)

    const where: Record<string, unknown> = {}

    if (orgId) {
      where.organizationId = orgId
    }

    if (status) {
      where.status = status
    }

    if (category) {
      where.category = category
    }

    if (fileType) {
      where.fileType = fileType
    }

    if (search) {
      where.OR = [
        { title: { contains: search,  } },
        { description: { contains: search,  } },
        { tags: { contains: search,  } },
      ]
    }

    const [items, total] = await Promise.all([
      db.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.document.count({ where }),
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (error) {
    console.error('Failed to fetch documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessCheck = await checkModuleAccess(request, 'documents')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const body = await request.json()

    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const orgId = await resolveOrgId(request, body.organizationId || '')

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // If incrementDownloads is true, increment download count for an existing document
    if (body.incrementDownloads && body.id) {
      const existing = await db.document.findUnique({ where: { id: body.id } })
      if (!existing) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        )
      }

      const document = await db.document.update({
        where: { id: body.id },
        data: {
          downloadCount: { increment: 1 },
        },
      })

      return NextResponse.json({ success: true, item: document })
    }

    const document = await db.document.create({
      data: {
        title: body.title,
        description: body.description || null,
        fileUrl: body.fileUrl || null,
        fileType: body.fileType || 'pdf',
        fileSize: body.fileSize || 0,
        category: body.category || null,
        tags: body.tags || null,
        downloadCount: body.downloadCount || 0,
        isPublic: body.isPublic || false,
        status: body.status || 'active',
        organizationId: orgId,
      },
    })

    return NextResponse.json({ success: true, item: document }, { status: 201 })
  } catch (error) {
    console.error('Failed to create document:', error)
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    )
  }
}

