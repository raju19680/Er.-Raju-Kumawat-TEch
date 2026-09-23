export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'

/**
 * Email Templates API
 *
 * GET    — List all email templates with stats. Supports ?category=xxx filter and ?key=xxx for single template lookup
 * POST   — Create new email template. Body: { key, name, subject, body, variables?, category?, isActive? }
 * PUT    — Update email template. Body: { id, subject?, body?, variables?, isActive?, name? }
 * DELETE — Delete email template. Body: { id }
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
    const categoryFilter = searchParams.get('category')
    const keyLookup = searchParams.get('key')

    // Single template lookup by key
    if (keyLookup) {
      const template = await db.emailTemplate.findUnique({
        where: { key: keyLookup },
      })
      if (!template) {
        return NextResponse.json(
          { success: false, message: 'Template not found.' },
          { status: 404 }
        )
      }
      return NextResponse.json({
        success: true,
        template: {
          id: template.id,
          key: template.key,
          name: template.name,
          subject: template.subject,
          body: template.body,
          variables: template.variables,
          category: template.category,
          isActive: template.isActive,
          createdAt: template.createdAt.toISOString(),
          updatedAt: template.updatedAt.toISOString(),
        },
      })
    }

    // Build where clause for category filter
    const where = categoryFilter ? { category: categoryFilter } : {}

    const templates = await db.emailTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Compute stats from ALL templates (not filtered)
    const allTemplates = categoryFilter
      ? await db.emailTemplate.findMany()
      : templates

    const total = allTemplates.length
    const active = allTemplates.filter((t) => t.isActive).length

    // Count by category
    const byCategory: Record<string, number> = {}
    for (const t of allTemplates) {
      byCategory[t.category] = (byCategory[t.category] || 0) + 1
    }

    return NextResponse.json({
      success: true,
      templates: templates.map((t) => ({
        id: t.id,
        key: t.key,
        name: t.name,
        subject: t.subject,
        body: t.body,
        variables: t.variables,
        category: t.category,
        isActive: t.isActive,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      stats: {
        total,
        active,
        byCategory,
      },
    })
  } catch (error) {
    console.error('Email templates GET error:', error)
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
    const { key, name, subject, body: templateBody, variables, category, isActive } = body

    if (!key || !name || !subject || !templateBody) {
      return NextResponse.json(
        { success: false, message: 'Key, name, subject, and body are required.' },
        { status: 400 }
      )
    }

    // Check for duplicate key
    const existing = await db.emailTemplate.findUnique({ where: { key: key.trim() } })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'An email template with this key already exists.' },
        { status: 409 }
      )
    }

    const template = await db.emailTemplate.create({
      data: {
        key: key.trim(),
        name: name.trim(),
        subject: subject.trim(),
        body: templateBody,
        variables: variables?.trim() || null,
        category: category || 'general',
        isActive: isActive ?? true,
      },
    })

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        key: template.key,
        name: template.name,
        subject: template.subject,
        body: template.body,
        variables: template.variables,
        category: template.category,
        isActive: template.isActive,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Email templates POST error:', error)
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
    const { id, subject, body: templateBody, variables, isActive, name } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Template ID is required.' },
        { status: 400 }
      )
    }

    const existing = await db.emailTemplate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Email template not found.' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (subject !== undefined) updateData.subject = subject.trim()
    if (templateBody !== undefined) updateData.body = templateBody
    if (variables !== undefined) updateData.variables = variables?.trim() || null
    if (isActive !== undefined) updateData.isActive = isActive
    if (name !== undefined) updateData.name = name.trim()

    const updated = await db.emailTemplate.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      template: {
        id: updated.id,
        key: updated.key,
        name: updated.name,
        subject: updated.subject,
        body: updated.body,
        variables: updated.variables,
        category: updated.category,
        isActive: updated.isActive,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Email templates PUT error:', error)
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
        { success: false, message: 'Template ID is required.' },
        { status: 400 }
      )
    }

    const existing = await db.emailTemplate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Email template not found.' },
        { status: 404 }
      )
    }

    await db.emailTemplate.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Email template deleted.' })
  } catch (error) {
    console.error('Email templates DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    )
  }
}
