export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'

/**
 * Platform Announcements API
 *
 * GET  — List announcements with pagination and filtering
 * POST — Create announcement
 * PUT  — Update announcement (toggle active, edit)
 * DELETE — Delete announcement
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const activeOnly = searchParams.get('active') === 'true'

    const skip = (page - 1) * limit

    const where = activeOnly
      ? { isActive: true, expiresAt: { gte: new Date() } }
      : {}

    const [announcements, total] = await Promise.all([
      db.announcement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.announcement.count({ where }),
    ])

    // Stats
    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    const [activeCount, totalCount, expiringSoonCount] = await Promise.all([
      db.announcement.count({
        where: { isActive: true, expiresAt: { gte: now } },
      }),
      db.announcement.count(),
      db.announcement.count({
        where: {
          isActive: true,
          expiresAt: { gte: now, lte: threeDaysFromNow },
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      announcements: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        message: a.message,
        type: a.type,
        isActive: a.isActive,
        startsAt: a.startsAt.toISOString(),
        expiresAt: a.expiresAt?.toISOString() ?? null,
        targetRole: a.targetRole,
        createdById: a.createdById,
        createdByName: a.createdByName,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        active: activeCount,
        total: totalCount,
        expiringSoon: expiringSoonCount,
      },
    })
  } catch (error) {
    console.error('Announcements GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await req.json()
    const { title, message, type, startsAt, expiresAt, targetRole } = body

    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: 'Title and message are required.' },
        { status: 400 }
      )
    }

    const announcement = await db.announcement.create({
      data: {
        title: title.trim(),
        message: message.trim(),
        type: type || 'info',
        isActive: true,
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        targetRole: targetRole || 'all',
        createdById: authResult.user.id,
        createdByName: authResult.user.name,
      },
    })

    return NextResponse.json({
      success: true,
      announcement: {
        id: announcement.id,
        title: announcement.title,
        message: announcement.message,
        type: announcement.type,
        isActive: announcement.isActive,
        startsAt: announcement.startsAt.toISOString(),
        expiresAt: announcement.expiresAt?.toISOString() ?? null,
        targetRole: announcement.targetRole,
        createdAt: announcement.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Announcements POST error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await req.json()
    const { id, isActive, title, message, expiresAt } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Announcement ID is required.' },
        { status: 400 }
      )
    }

    const existing = await db.announcement.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Announcement not found.' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (isActive !== undefined) updateData.isActive = isActive
    if (title !== undefined) updateData.title = title.trim()
    if (message !== undefined) updateData.message = message.trim()
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null

    const updated = await db.announcement.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      announcement: {
        id: updated.id,
        title: updated.title,
        message: updated.message,
        type: updated.type,
        isActive: updated.isActive,
        startsAt: updated.startsAt.toISOString(),
        expiresAt: updated.expiresAt?.toISOString() ?? null,
        targetRole: updated.targetRole,
        createdAt: updated.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Announcements PUT error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Announcement ID is required.' },
        { status: 400 }
      )
    }

    const existing = await db.announcement.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Announcement not found.' },
        { status: 404 }
      )
    }

    await db.announcement.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Announcement deleted.' })
  } catch (error) {
    console.error('Announcements DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    )
  }
}
