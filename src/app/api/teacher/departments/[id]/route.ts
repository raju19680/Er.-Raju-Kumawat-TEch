export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'
import { resolveOrgId } from '@/lib/demo-org'

// Using imported resolveOrgId from demo-org

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(req, 'settings')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id } = await params
    const body = await req.json()

    if (!id) {
      return NextResponse.json({ success: false, error: 'Department ID is required' }, { status: 400 })
    }

    const existing = await db.department.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Department not found' }, { status: 404 })
    }

    // If code is being changed, check unique constraint
    if (body.code && body.code !== existing.code) {
      const orgId = body.organizationId
        ? await resolveOrgId(req, body.organizationId)
        : existing.organizationId

      const duplicate = await db.department.findUnique({
        where: {
          code_organizationId: {
            code: body.code,
            organizationId: orgId,
          },
        },
      })
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'A department with this code already exists in this organization' },
          { status: 409 }
        )
      }
    }

    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data.name = body.name
    if (body.code !== undefined) data.code = body.code
    if (body.description !== undefined) data.description = body.description
    if (body.headName !== undefined) data.headName = body.headName
    if (body.headEmail !== undefined) data.headEmail = body.headEmail
    if (body.headPhone !== undefined) data.headPhone = body.headPhone
    if (body.icon !== undefined) data.icon = body.icon
    if (body.color !== undefined) data.color = body.color
    if (body.status !== undefined) data.status = body.status
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder

    const department = await db.department.update({
      where: { id },
      data,
    })

    return NextResponse.json({ success: true, department })
  } catch (error) {
    console.error('Failed to update department:', error)
    return NextResponse.json({ success: false, error: 'Failed to update department' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(req, 'settings')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json({ success: false, error: 'Department ID is required' }, { status: 400 })
    }

    const existing = await db.department.findUnique({
      where: { id },
      include: { _count: { select: { students: true } } },
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Department not found' }, { status: 404 })
    }

    // If department has students, set their departmentId to null first
    if (existing._count.students > 0) {
      await db.student.updateMany({
        where: { departmentId: id },
        data: { departmentId: null },
      })
    }

    await db.department.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete department:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete department' }, { status: 500 })
  }
}

