export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'Section name is required' }, { status: 400 })
    }

    // Verify section exists
    const existing = await db.section.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    // Check for duplicate name within the same org (excluding current section)
    const duplicate = await db.section.findUnique({
      where: {
        name_organizationId: {
          name: body.name.trim(),
          organizationId: existing.organizationId,
        },
      },
    })

    if (duplicate && duplicate.id !== id) {
      return NextResponse.json(
        { error: 'A section with this name already exists' },
        { status: 409 }
      )
    }

    const oldName = existing.name
    const newName = body.name.trim()

    // Update the section
    const section = await db.section.update({
      where: { id },
      data: { name: newName },
    })

    // If the name changed, also update all questions that reference the old section name
    if (oldName !== newName) {
      await db.question.updateMany({
        where: { section: oldName },
        data: { section: newName },
      })
    }

    // Compute question count for the updated section
    const questionCount = await db.question.count({
      where: { section: section.name },
    })

    return NextResponse.json({
      success: true,
      section: {
        id: section.id,
        name: section.name,
        questionCount,
        createdAt: section.createdAt,
        updatedAt: section.updatedAt,
      },
    })
  } catch (error) {
    console.error('Failed to update section:', error)
    return NextResponse.json({ error: 'Failed to update section' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'settings')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id } = await params

    // Verify section exists
    const existing = await db.section.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    // Delete the section
    await db.section.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete section:', error)
    return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 })
  }
}

