export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'students')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id } = await params
    const student = await db.student.findUnique({
      where: { id },
      include: {
        purchasedCourses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                thumbnail: true,
              }
            }
          }
        },
        purchasedTestSeries: {
          include: {
            testSeries: {
              select: {
                id: true,
                title: true,
                thumbnail: true,
              }
            }
          }
        },
        purchasedDigitalProducts: {
          include: {
            digitalProduct: {
              select: {
                id: true,
                title: true,
                thumbnail: true,
              }
            }
          }
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        deviceSessions: {
          orderBy: { lastActive: 'desc' },
          take: 15
        },
        streak: true,
        _count: {
          select: {
            testAttempts: true,
            orders: true,
            purchasedCourses: true,
          },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, student })
  } catch (error) {
    console.error('Failed to fetch student:', error)
    return NextResponse.json({ error: 'Failed to fetch student' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'students')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id } = await params
    const body = await request.json()
    const { 
      name, email, phone, avatar, isActive, isBlocked, blockedReason,
      address, city, state, pincode, password 
    } = body

    const student = await db.student.findUnique({ where: { id } })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (avatar !== undefined) updateData.avatar = avatar
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (pincode !== undefined) updateData.pincode = pincode

    if (isActive !== undefined) updateData.isActive = isActive
    if (isBlocked !== undefined) {
      updateData.isBlocked = isBlocked
      updateData.blockedReason = isBlocked ? (blockedReason || 'Blocked by teacher') : null
      updateData.blockedAt = isBlocked ? new Date() : null
    }

    // Handle Password Change if requested
    if (password && student.userId) {
      const hashedPassword = await hash(password, 10)
      await db.user.update({
        where: { id: student.userId },
        data: { password: hashedPassword, passwordChangedAt: new Date() }
      })
    }

    const updatedStudent = await db.student.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, student: updatedStudent })
  } catch (error) {
    console.error('Failed to update student:', error)
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'students')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id } = await params
    await db.student.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete student:', error)
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 })
  }
}

