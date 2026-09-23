export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'
import { resolveOrgId } from '@/lib/demo-org'

// resolveOrgId imported from demo-org

export async function GET(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'courses')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const orgId = await resolveOrgId(request, searchParams.get('organizationId') || undefined)

    const whereConditions: Record<string, unknown>[] = [{ organizationId: orgId }]
    
    // Type filter
    const typeFilter = searchParams.get('type')
    if (typeFilter) {
      whereConditions.push({ type: typeFilter })
    }
    
    // Status filter
    const statusFilter = searchParams.get('status')
    if (statusFilter) {
      whereConditions.push({ status: statusFilter })
    }
    
    // Category filter
    const categoryFilter = searchParams.get('category')
    if (categoryFilter) {
      whereConditions.push({ category: categoryFilter })
    }
    
    // Search filter (title, description, category)
    if (search) {
      whereConditions.push({
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
          { category: { contains: search } },
        ],
      })
    }

    const where = whereConditions.length === 1 ? whereConditions[0] : { AND: whereConditions }

    const [items, total] = await Promise.all([
      db.digitalProduct.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.digitalProduct.count({ where }),
    ])

    return NextResponse.json({ items, total })
  } catch (error) {
    console.error('Failed to fetch digital products:', error)
    return NextResponse.json({ error: 'Failed to fetch digital products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'courses')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const orgId = await resolveOrgId(request, body.organizationId)

    const product = await db.digitalProduct.create({
      data: {
        title: body.title,
        description: body.description || null,
        thumbnail: body.thumbnail || null,
        file: body.file || null,
        type: body.type || 'course',
        category: body.category || null,
        language: body.language || null,
        level: body.level || null,
        price: body.price ?? 0,
        mrp: body.mrp ?? 0,
        status: body.status || 'draft',
        featured: body.featured ?? false,
        organizationId: orgId,
        // E-Book specific
        author: body.author || null,
        pages: body.pages || null,
        isbn: body.isbn || null,
        edition: body.edition || null,
        publisher: body.publisher || null,
        // Notes specific
        subject: body.subject || null,
        chapter: body.chapter || null,
        // Test Series specific
        totalTests: body.totalTests || null,
        totalQuestions: body.totalQuestions || null,
        duration: body.duration || null,
        validityDays: body.validityDays || null,
        syllabus: body.syllabus || null,
        // Other product specific
        productType: body.productType || null,
        format: body.format || null,
      },
    })

    return NextResponse.json({ success: true, product }, { status: 201 })
  } catch (error) {
    console.error('Failed to create digital product:', error)
    return NextResponse.json({ error: 'Failed to create digital product' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'courses')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()
    if (!body.id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const existing = await db.digitalProduct.findUnique({ where: { id: body.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Digital product not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (body.title !== undefined) data.title = body.title
    if (body.description !== undefined) data.description = body.description
    if (body.thumbnail !== undefined) data.thumbnail = body.thumbnail
    if (body.file !== undefined) data.file = body.file
    if (body.type !== undefined) data.type = body.type
    if (body.category !== undefined) data.category = body.category
    if (body.language !== undefined) data.language = body.language
    if (body.level !== undefined) data.level = body.level
    if (body.price !== undefined) data.price = body.price
    if (body.mrp !== undefined) data.mrp = body.mrp
    if (body.status !== undefined) data.status = body.status
    if (body.featured !== undefined) data.featured = body.featured
    // E-Book specific
    if (body.author !== undefined) data.author = body.author
    if (body.pages !== undefined) data.pages = body.pages
    if (body.isbn !== undefined) data.isbn = body.isbn
    if (body.edition !== undefined) data.edition = body.edition
    if (body.publisher !== undefined) data.publisher = body.publisher
    // Notes specific
    if (body.subject !== undefined) data.subject = body.subject
    if (body.chapter !== undefined) data.chapter = body.chapter
    // Test Series specific
    if (body.totalTests !== undefined) data.totalTests = body.totalTests
    if (body.totalQuestions !== undefined) data.totalQuestions = body.totalQuestions
    if (body.duration !== undefined) data.duration = body.duration
    if (body.validityDays !== undefined) data.validityDays = body.validityDays
    if (body.syllabus !== undefined) data.syllabus = body.syllabus
    // Other product specific
    if (body.productType !== undefined) data.productType = body.productType
    if (body.format !== undefined) data.format = body.format

    const product = await db.digitalProduct.update({
      where: { id: body.id },
      data,
    })

    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error('Failed to update digital product:', error)
    return NextResponse.json({ error: 'Failed to update digital product' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'courses')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const existing = await db.digitalProduct.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Digital product not found' }, { status: 404 })
    }

    await db.digitalProduct.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete digital product:', error)
    return NextResponse.json({ error: 'Failed to delete digital product' }, { status: 500 })
  }
}

