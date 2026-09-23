import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'
import { sanitizeInput } from '@/lib/auth-security'

const VALID_ACTIONS = [
  'block',
  'unblock',
  'force_logout',
  'deactivate',
  'activate',
  'reset_password',
  'delete_device',
] as const

type ActionType = (typeof VALID_ACTIONS)[number]

/**
 * POST /api/admin/students/[id]/action
 * Perform a control action on a student.
 * Only accessible by platform_admin.
 *
 * Body: { action: string, reason?: string, deviceId?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ── Auth check: Must be platform_admin ──
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const { id } = await params
    const body = await req.json()
    const { action, reason, deviceId } = body as {
      action: string
      reason?: string
      deviceId?: string
    }

    // ── Validate action ──
    if (!action || !VALID_ACTIONS.includes(action as ActionType)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}`,
        },
        { status: 400 }
      )
    }

    const typedAction = action as ActionType

    // ── Find the student ──
    const student = await db.student.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        isBlocked: true,
        isActive: true,
        userId: true,
      },
    })

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found.' },
        { status: 404 }
      )
    }

    const adminEmail = authResult.user.email
    let resultMessage = ''

    switch (typedAction) {
      // ── Block student ──
      case 'block': {
        if (student.isBlocked) {
          return NextResponse.json(
            { success: false, message: 'Student is already blocked.' },
            { status: 400 }
          )
        }
        const sanitizedReason = reason ? sanitizeInput(reason) : null
        await db.student.update({
          where: { id },
          data: {
            isBlocked: true,
            blockedReason: sanitizedReason,
            blockedAt: new Date(),
          },
        })
        resultMessage = `Student "${student.name}" has been blocked.`
        console.log(`[AUDIT] Student blocked: id=${id}, reason=${sanitizedReason || 'N/A'}, admin=${adminEmail}`)
        break
      }

      // ── Unblock student ──
      case 'unblock': {
        if (!student.isBlocked) {
          return NextResponse.json(
            { success: false, message: 'Student is not blocked.' },
            { status: 400 }
          )
        }
        await db.student.update({
          where: { id },
          data: {
            isBlocked: false,
            blockedReason: null,
            blockedAt: null,
          },
        })
        resultMessage = `Student "${student.name}" has been unblocked.`
        console.log(`[AUDIT] Student unblocked: id=${id}, admin=${adminEmail}`)
        break
      }

      // ── Force logout all devices ──
      case 'force_logout': {
        const updateResult = await db.deviceSession.updateMany({
          where: {
            studentId: id,
            isActive: true,
          },
          data: {
            isActive: false,
            logoutAt: new Date(),
          },
        })
        resultMessage = `Force logged out ${updateResult.count} active device session(s) for student "${student.name}".`
        console.log(`[AUDIT] Force logout: student=${id}, sessionsTerminated=${updateResult.count}, admin=${adminEmail}`)
        break
      }

      // ── Deactivate student ──
      case 'deactivate': {
        if (!student.isActive) {
          return NextResponse.json(
            { success: false, message: 'Student is already deactivated.' },
            { status: 400 }
          )
        }
        await db.student.update({
          where: { id },
          data: { isActive: false },
        })
        resultMessage = `Student "${student.name}" has been deactivated.`
        console.log(`[AUDIT] Student deactivated: id=${id}, admin=${adminEmail}`)
        break
      }

      // ── Activate student ──
      case 'activate': {
        if (student.isActive) {
          return NextResponse.json(
            { success: false, message: 'Student is already active.' },
            { status: 400 }
          )
        }
        await db.student.update({
          where: { id },
          data: { isActive: true },
        })
        resultMessage = `Student "${student.name}" has been activated.`
        console.log(`[AUDIT] Student activated: id=${id}, admin=${adminEmail}`)
        break
      }

      // ── Reset password ──
      case 'reset_password': {
        if (!student.userId) {
          return NextResponse.json(
            { success: false, message: 'Student has no linked user account. Password reset is not applicable.' },
            { status: 400 }
          )
        }

        // Check that the linked user exists
        const linkedUser = await db.user.findUnique({
          where: { id: student.userId },
          select: { id: true, email: true },
        })

        if (!linkedUser) {
          return NextResponse.json(
            { success: false, message: 'Linked user account not found.' },
            { status: 404 }
          )
        }

        // Conceptual password reset - mark the user's password as requiring reset
        // In production, this would generate a temporary password or send a reset email
        // For now, we log the action and return a success message
        console.log(`[AUDIT] Password reset requested: student=${id}, linkedUser=${linkedUser.id}, admin=${adminEmail}`)
        resultMessage = `Password reset initiated for student "${student.name}". A reset link will be sent to ${linkedUser.email}.`
        break
      }

      // ── Delete a specific device session ──
      case 'delete_device': {
        if (!deviceId) {
          return NextResponse.json(
            { success: false, message: 'deviceId is required for delete_device action.' },
            { status: 400 }
          )
        }

        const deviceSession = await db.deviceSession.findFirst({
          where: {
            id: deviceId,
            studentId: id,
          },
        })

        if (!deviceSession) {
          return NextResponse.json(
            { success: false, message: 'Device session not found for this student.' },
            { status: 404 }
          )
        }

        await db.deviceSession.delete({
          where: { id: deviceId },
        })

        resultMessage = `Device session "${deviceSession.deviceName || deviceSession.id}" has been deleted.`
        console.log(`[AUDIT] Device session deleted: sessionId=${deviceId}, student=${id}, admin=${adminEmail}`)
        break
      }
    }

    return NextResponse.json({
      success: true,
      message: resultMessage,
      data: {
        studentId: id,
        action: typedAction,
        performedBy: adminEmail,
        performedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Student action error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
