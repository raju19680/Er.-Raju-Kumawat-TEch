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

    if (search) {
      where.OR = [
        { title: { contains: search,  } },
        { channelName: { contains: search,  } },
        { description: { contains: search,  } },
      ]
    }

    const [items, total] = await Promise.all([
      db.youtubeCourse.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.youtubeCourse.count({ where }),
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (error) {
    console.error('Failed to fetch YouTube courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch YouTube courses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessCheck = await checkModuleAccess(request, 'youtube_courses')
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

    if (!body.organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const orgId = await resolveOrgId(request, body.organizationId)

    const course = await db.youtubeCourse.create({
      data: {
        title: body.title,
        description: body.description || null,
        thumbnail: body.thumbnail || null,
        playlistId: body.playlistId || null,
        playlistUrl: body.playlistUrl || null,
        channelName: body.channelName || null,
        totalVideos: body.totalVideos || 0,
        totalDuration: body.totalDuration || 0,
        category: body.category || null,
        level: body.level || 'All',
        language: body.language || 'Hindi',
        price: body.price || 0,
        mrp: body.mrp || 0,
        status: body.status || 'draft',
        featured: body.featured || false,
        organizationId: orgId,
      },
    })

    return NextResponse.json({ success: true, item: course }, { status: 201 })
  } catch (error) {
    console.error('Failed to create YouTube course:', error)
    return NextResponse.json(
      { error: 'Failed to create YouTube course' },
      { status: 500 }
    )
  }
}

