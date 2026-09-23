export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'

/**
 * Feature Flags API
 *
 * GET    — List all feature flags (seed defaults if none exist)
 * POST   — Create feature flag
 * PUT    — Update feature flag (toggle, edit rollout, etc.)
 * DELETE — Delete feature flag
 */

// Default feature flags to seed
const DEFAULT_FLAGS = [
  { key: 'chat_manager', name: 'Chat Manager', description: 'Enable in-app chat management system', enabled: false, rolloutPct: 100, targetRole: 'all' },
  { key: 'whatsapp_integration', name: 'WhatsApp Integration', description: 'Enable WhatsApp messaging integration', enabled: false, rolloutPct: 100, targetRole: 'teacher' },
  { key: 'ai_assistant', name: 'AI Assistant', description: 'Enable AI-powered assistant for teachers and students', enabled: false, rolloutPct: 50, targetRole: 'all' },
  { key: 'video_courses', name: 'Video Courses', description: 'Enable video course hosting and streaming', enabled: true, rolloutPct: 100, targetRole: 'all' },
  { key: 'bulk_import', name: 'Bulk Import', description: 'Enable bulk import of students and questions', enabled: true, rolloutPct: 100, targetRole: 'teacher' },
  { key: 'advanced_analytics', name: 'Advanced Analytics', description: 'Enable advanced analytics and reporting features', enabled: false, rolloutPct: 0, targetRole: 'teacher' },
]

export async function GET(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    // Seed default flags if none exist
    const existingCount = await db.featureFlag.count()
    if (existingCount === 0) {
      await db.featureFlag.createMany({
        data: DEFAULT_FLAGS.map((flag) => ({
          ...flag,
          updatedBy: authResult.user.id,
        })),
      })
    }

    const flags = await db.featureFlag.findMany({
      orderBy: { createdAt: 'asc' },
    })

    const enabledCount = flags.filter((f) => f.enabled).length
    const disabledCount = flags.filter((f) => !f.enabled).length

    return NextResponse.json({
      success: true,
      flags: flags.map((f) => ({
        id: f.id,
        key: f.key,
        name: f.name,
        description: f.description,
        enabled: f.enabled,
        rolloutPct: f.rolloutPct,
        targetRole: f.targetRole,
        updatedBy: f.updatedBy,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
      })),
      stats: {
        enabled: enabledCount,
        disabled: disabledCount,
        total: flags.length,
      },
    })
  } catch (error) {
    console.error('Feature flags GET error:', error)
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
    const { key, name, description, enabled, rolloutPct, targetRole } = body

    if (!key || !name) {
      return NextResponse.json(
        { success: false, message: 'Key and name are required.' },
        { status: 400 }
      )
    }

    // Check for duplicate key
    const existing = await db.featureFlag.findUnique({ where: { key } })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'A feature flag with this key already exists.' },
        { status: 409 }
      )
    }

    const flag = await db.featureFlag.create({
      data: {
        key: key.trim(),
        name: name.trim(),
        description: description?.trim() || null,
        enabled: enabled ?? false,
        rolloutPct: rolloutPct ?? 100,
        targetRole: targetRole || 'all',
        updatedBy: authResult.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      flag: {
        id: flag.id,
        key: flag.key,
        name: flag.name,
        description: flag.description,
        enabled: flag.enabled,
        rolloutPct: flag.rolloutPct,
        targetRole: flag.targetRole,
        createdAt: flag.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Feature flags POST error:', error)
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
    const { id, enabled, rolloutPct, name, description, targetRole } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Feature flag ID is required.' },
        { status: 400 }
      )
    }

    const existing = await db.featureFlag.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Feature flag not found.' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = { updatedBy: authResult.user.id }
    if (enabled !== undefined) updateData.enabled = enabled
    if (rolloutPct !== undefined) updateData.rolloutPct = Math.min(100, Math.max(0, rolloutPct))
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (targetRole !== undefined) updateData.targetRole = targetRole

    const updated = await db.featureFlag.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      flag: {
        id: updated.id,
        key: updated.key,
        name: updated.name,
        description: updated.description,
        enabled: updated.enabled,
        rolloutPct: updated.rolloutPct,
        targetRole: updated.targetRole,
        createdAt: updated.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Feature flags PUT error:', error)
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
        { success: false, message: 'Feature flag ID is required.' },
        { status: 400 }
      )
    }

    const existing = await db.featureFlag.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Feature flag not found.' },
        { status: 404 }
      )
    }

    await db.featureFlag.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Feature flag deleted.' })
  } catch (error) {
    console.error('Feature flags DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    )
  }
}
