export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'

/**
 * App Version Manager API
 *
 * GET    — List all app versions with stats (supports ?platform=xxx filter)
 * POST   — Create new version
 * PUT    — Update version
 * DELETE — Delete version
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

    const platformFilter = req.nextUrl.searchParams.get('platform')

    const where = platformFilter && platformFilter !== 'all'
      ? { platform: platformFilter }
      : {}

    const versions = await db.appVersion.findMany({
      where,
      orderBy: { releasedAt: 'desc' },
    })

    // Compute stats across ALL versions (unfiltered)
    const allVersions = await db.appVersion.findMany()
    const activeCount = allVersions.filter((v) => v.isActive).length
    const androidCount = allVersions.filter((v) => v.platform === 'android').length
    const iosCount = allVersions.filter((v) => v.platform === 'ios').length
    const webCount = allVersions.filter((v) => v.platform === 'web').length

    return NextResponse.json({
      success: true,
      versions: versions.map((v) => ({
        id: v.id,
        version: v.version,
        platform: v.platform,
        changelog: v.changelog,
        downloadUrl: v.downloadUrl,
        isForceUpdate: v.isForceUpdate,
        isActive: v.isActive,
        releasedAt: v.releasedAt.toISOString(),
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
      })),
      stats: {
        total: allVersions.length,
        active: activeCount,
        byPlatform: {
          android: androidCount,
          ios: iosCount,
          web: webCount,
        },
      },
    })
  } catch (error) {
    console.error('App versions GET error:', error)
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
    const { version, platform, changelog, downloadUrl, isForceUpdate, isActive } = body

    if (!version || !version.trim()) {
      return NextResponse.json(
        { success: false, message: 'Version is required.' },
        { status: 400 }
      )
    }

    const created = await db.appVersion.create({
      data: {
        version: version.trim(),
        platform: platform || 'android',
        changelog: changelog?.trim() || null,
        downloadUrl: downloadUrl?.trim() || null,
        isForceUpdate: isForceUpdate ?? false,
        isActive: isActive ?? true,
      },
    })

    return NextResponse.json({
      success: true,
      version: {
        id: created.id,
        version: created.version,
        platform: created.platform,
        changelog: created.changelog,
        downloadUrl: created.downloadUrl,
        isForceUpdate: created.isForceUpdate,
        isActive: created.isActive,
        releasedAt: created.releasedAt.toISOString(),
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('App versions POST error:', error)
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
    const { id, version, changelog, downloadUrl, isForceUpdate, isActive } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Version ID is required.' },
        { status: 400 }
      )
    }

    const existing = await db.appVersion.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'App version not found.' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (version !== undefined) updateData.version = version.trim()
    if (changelog !== undefined) updateData.changelog = changelog?.trim() || null
    if (downloadUrl !== undefined) updateData.downloadUrl = downloadUrl?.trim() || null
    if (isForceUpdate !== undefined) updateData.isForceUpdate = isForceUpdate
    if (isActive !== undefined) updateData.isActive = isActive

    const updated = await db.appVersion.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      version: {
        id: updated.id,
        version: updated.version,
        platform: updated.platform,
        changelog: updated.changelog,
        downloadUrl: updated.downloadUrl,
        isForceUpdate: updated.isForceUpdate,
        isActive: updated.isActive,
        releasedAt: updated.releasedAt.toISOString(),
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('App versions PUT error:', error)
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
        { success: false, message: 'Version ID is required.' },
        { status: 400 }
      )
    }

    const existing = await db.appVersion.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'App version not found.' },
        { status: 404 }
      )
    }

    await db.appVersion.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'App version deleted.' })
  } catch (error) {
    console.error('App versions DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    )
  }
}
