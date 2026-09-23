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
    const course = await db.youtubeCourse.findUnique({
      where: { id },
    })

    if (!course) {
      return NextResponse.json(
        { error: 'YouTube course not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, item: course })
  } catch (error) {
    console.error('Failed to fetch YouTube course:', error)
    return NextResponse.json(
      { error: 'Failed to fetch YouTube course' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'youtube_courses')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params
    const body = await request.json()

    const existing = await db.youtubeCourse.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'YouTube course not found' },
        { status: 404 }
      )
    }

    let orgId = existing.organizationId
    if (body.organizationId) {
      orgId = await resolveOrgId(request, body.organizationId)
    }

    const course = await db.youtubeCourse.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.thumbnail !== undefined && { thumbnail: body.thumbnail || null }),
        ...(body.playlistId !== undefined && { playlistId: body.playlistId || null }),
        ...(body.playlistUrl !== undefined && { playlistUrl: body.playlistUrl || null }),
        ...(body.channelName !== undefined && { channelName: body.channelName || null }),
        ...(body.totalVideos !== undefined && { totalVideos: body.totalVideos }),
        ...(body.totalDuration !== undefined && { totalDuration: body.totalDuration }),
        ...(body.category !== undefined && { category: body.category || null }),
        ...(body.level !== undefined && { level: body.level }),
        ...(body.language !== undefined && { language: body.language }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.mrp !== undefined && { mrp: body.mrp }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.featured !== undefined && { featured: body.featured }),
        ...(body.organizationId && { organizationId: orgId }),
      },
    })

    return NextResponse.json({ success: true, item: course })
  } catch (error) {
    console.error('Failed to update YouTube course:', error)
    return NextResponse.json(
      { error: 'Failed to update YouTube course' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkModuleAccess(request, 'youtube_courses')
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { success: false, message: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    const { id } = await params

    const existing = await db.youtubeCourse.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'YouTube course not found' },
        { status: 404 }
      )
    }

    await db.youtubeCourse.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Deleted' })
  } catch (error) {
    console.error('Failed to delete YouTube course:', error)
    return NextResponse.json(
      { error: 'Failed to delete YouTube course' },
      { status: 500 }
    )
  }
}

