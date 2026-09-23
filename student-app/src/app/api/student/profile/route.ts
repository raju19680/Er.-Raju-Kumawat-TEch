import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        avatar: student.avatar,
        address: student.address ?? null,
        city: student.city ?? null,
        state: student.state ?? null,
        pincode: student.pincode ?? null,
        createdAt: student.createdAt,
      },
    })
  } catch (error) {
    console.error('Student profile GET error:', error)
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const body = await req.json()
    const { name, phone, address, city, state, pincode, avatar, currentPassword, newPassword } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 })
    }

    // If password change is requested
    if (currentPassword || newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ success: false, message: 'Current password is required to set a new password' }, { status: 400 })
      }
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ success: false, message: 'New password must be at least 6 characters long' }, { status: 400 })
      }

      const userRecord = await db.user.findUnique({ where: { id: auth.id } })
      if (!userRecord) {
        return NextResponse.json({ success: false, message: 'User record not found' }, { status: 404 })
      }

      const isMatch = await bcrypt.compare(currentPassword, userRecord.password)
      if (!isMatch) {
        return NextResponse.json({ success: false, message: 'Incorrect current password' }, { status: 400 })
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10)
      await db.user.update({
        where: { id: auth.id },
        data: { password: hashedNewPassword, passwordChangedAt: new Date() },
      })
    }

    // Update student record
    const updatedStudent = await db.student.update({
      where: { id: student.id },
      data: {
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        avatar: avatar || student.avatar,
        address: address ? address.trim() : null,
        city: city ? city.trim() : null,
        state: state ? state.trim() : null,
        pincode: pincode ? pincode.trim() : null,
      },
    })

    // Sync to User record (non-critical)
    await db.user.update({
      where: { id: auth.id },
      data: {
        name: name.trim(),
        ...(phone ? { phone: phone.trim() } : {}),
        ...(avatar ? { avatar } : {}),
      },
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      student: {
        id: updatedStudent.id,
        name: updatedStudent.name,
        email: updatedStudent.email,
        phone: updatedStudent.phone,
        avatar: updatedStudent.avatar,
        address: updatedStudent.address ?? null,
        city: updatedStudent.city ?? null,
        state: updatedStudent.state ?? null,
        pincode: updatedStudent.pincode ?? null,
      },
    })
  } catch (error) {
    console.error('Student profile PUT error:', error)
    return NextResponse.json({ success: false, message: 'Failed to update profile' }, { status: 500 })
  }
}
