import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'
import { hashPassword } from '@/lib/auth'

// GET - Get a specific teacher
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const { id } = await params
    const teacher = await db.user.findFirst({
      where: { id, role: 'teacher' },
      include: {
        organization: true,
        students: true,
      },
    })

    if (!teacher) {
      return NextResponse.json({ success: false, message: 'Teacher not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, teacher })
  } catch (error) {
    console.error('Get teacher error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a teacher
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const { id } = await params
    const body = await req.json()
    const { name, email, phone, password, organizationName, status } = body

    const existing = await db.user.findFirst({ where: { id, role: 'teacher' } })
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Teacher not found' }, { status: 404 })
    }

    if (email && email.toLowerCase() !== existing.email.toLowerCase()) {
      const conflict = await db.user.findUnique({
        where: { email: email.toLowerCase() },
      })
      if (conflict) {
        return NextResponse.json(
          { success: false, message: 'Email already in use' },
          { status: 409 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email.toLowerCase()
    if (phone !== undefined) updateData.phone = phone
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { success: false, message: 'Password must be at least 6 characters' },
          { status: 400 }
        )
      }
      updateData.password = await hashPassword(password)
    }

    const teacher = await db.user.update({
      where: { id },
      data: updateData,
    })

    if (existing.organizationId && (organizationName !== undefined || status !== undefined)) {
      await db.organization.update({
        where: { id: existing.organizationId },
        data: {
          ...(organizationName ? { name: organizationName } : {}),
          ...(status ? { status } : {}),
        },
      })
    }

    return NextResponse.json({ success: true, teacher })
  } catch (error) {
    console.error('Update teacher error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a teacher
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const { id } = await params
    const existing = await db.user.findFirst({ where: { id, role: 'teacher' } })
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Teacher not found' }, { status: 404 })
    }

    await db.user.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete teacher error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
