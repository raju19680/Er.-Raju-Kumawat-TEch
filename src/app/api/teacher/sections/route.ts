export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'
import { resolveOrgId } from '@/lib/demo-org'

// resolveOrgId imported from demo-org

const DEFAULT_SECTIONS = [
  'Physics',
  'Chemistry',
  'Mathematics',
  'Biology',
  'Reasoning',
  'General Knowledge',
]

export async function GET(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'settings')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const searchParams = request.nextUrl.searchParams
    const orgId = await resolveOrgId(request, searchParams.get('organizationId') || undefined)

    // Auto-seed default sections if none exist for the org
    const existingCount = await db.section.count({
      where: { organizationId: orgId },
    })

    if (existingCount === 0) {
      await db.section.createMany({
        data: DEFAULT_SECTIONS.map((name) => ({
          name,
          organizationId: orgId,
        })),
      })
    }

    // Fetch all sections for the org
    const sections = await db.section.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'asc' },
    })

    // Compute question count for each section by counting questions with matching section name
    const items = await Promise.all(
      sections.map(async (section) => {
        const questionCount = await db.question.count({
          where: { section: section.name },
        })
        return {
          id: section.id,
          name: section.name,
          questionCount,
          createdAt: section.createdAt,
        }
      })
    )

    return NextResponse.json({ items, total: items.length })
  } catch (error) {
    console.error('Failed to fetch sections:', error)
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'settings')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'Section name is required' }, { status: 400 })
    }

    const orgId = await resolveOrgId(request, body.organizationId)

    // Check for duplicate name within the org
    const existing = await db.section.findUnique({
      where: {
        name_organizationId: {
          name: body.name.trim(),
          organizationId: orgId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A section with this name already exists' },
        { status: 409 }
      )
    }

    const section = await db.section.create({
      data: {
        name: body.name.trim(),
        organizationId: orgId,
      },
    })

    // Compute question count for the new section
    const questionCount = await db.question.count({
      where: { section: section.name },
    })

    return NextResponse.json(
      {
        id: section.id,
        name: section.name,
        questionCount,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create section:', error)
    return NextResponse.json({ error: 'Failed to create section' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 })
    }
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'Section name is required' }, { status: 400 })
    }

    // Fetch existing section
    const existingSection = await db.section.findUnique({
      where: { id: body.id },
    })

    if (!existingSection) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    const oldName = existingSection.name
    const newName = body.name.trim()

    // Update the section name
    const section = await db.section.update({
      where: { id: body.id },
      data: { name: newName },
    })

    // Also update all questions that had the old section name
    if (oldName !== newName) {
      await db.question.updateMany({
        where: { section: oldName },
        data: { section: newName },
      })
    }

    const questionCount = await db.question.count({
      where: { section: section.name },
    })

    return NextResponse.json({
      id: section.id,
      name: section.name,
      questionCount,
    })
  } catch (error) {
    console.error('Failed to update section:', error)
    return NextResponse.json({ error: 'Failed to update section' }, { status: 500 })
  }
}

