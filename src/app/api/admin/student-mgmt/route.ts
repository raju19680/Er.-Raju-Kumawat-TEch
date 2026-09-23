export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminOrTeacher } from '@/lib/auth-helpers'

/**
 * GET /api/admin/student-mgmt
 * Fetch student attendance records, notes, and communication history.
 * Accessible by platform_admin (Super Admin) and teachers/org_admins.
 *
 * Super Admin can view and manage students across all teachers & organizations.
 * Teachers can view and manage their organization / assigned students.
 *
 * Query params:
 *   organizationId — filter by organization (Super Admin can choose, teachers scoped to theirs)
 *   teacherId      — filter by specific teacher
 *   date           — specific date for attendance (YYYY-MM-DD)
 *   studentId      — filter by specific student
 *   type           — "attendance" | "notes" | "communications"
 */
export async function GET(req: NextRequest) {
  try {
    // ── Auth check ──
    const authResult = await requireAdminOrTeacher(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const auth = authResult.user
    const isSuperAdmin = auth.role === 'platform_admin'

    const { searchParams } = new URL(req.url)
    const paramOrgId = searchParams.get('organizationId')?.trim() || ''
    const paramTeacherId = searchParams.get('teacherId')?.trim() || ''
    const dateStr = searchParams.get('date')?.trim() || ''
    const studentId = searchParams.get('studentId')?.trim() || ''
    const type = searchParams.get('type')?.trim() || 'attendance'

    // Organization filter: Super Admin can pick any org or view all; teachers strictly scoped to their org
    const effectiveOrgId = isSuperAdmin ? (paramOrgId || undefined) : (auth.orgId || undefined)

    // ── Build common student filter ──
    const studentWhere: any = {}
    if (effectiveOrgId) {
      studentWhere.organizationId = effectiveOrgId
    }
    if (studentId) {
      studentWhere.id = studentId
    }
    if (paramTeacherId) {
      studentWhere.teacherId = paramTeacherId
    } else if (!isSuperAdmin && auth.role === 'teacher') {
      // If teacher is logged in, optionally filter by teacherId if they have assigned students
      // but still allow viewing org students if no specific teacher assigned
      // studentWhere.organizationId is already set
    }

    // ── Format date string for attendance (YYYY-MM-DD) ──
    let attendanceDateStr = dateStr
    if (!attendanceDateStr) {
      const now = new Date()
      attendanceDateStr = now.toISOString().split('T')[0]
    } else {
      // Validate date string
      const parsed = new Date(dateStr)
      if (!isNaN(parsed.getTime())) {
        attendanceDateStr = parsed.toISOString().split('T')[0]
      } else {
        attendanceDateStr = new Date().toISOString().split('T')[0]
      }
    }

    // ── Attendance data ──
    if (type === 'attendance') {
      const attendanceWhere: any = {
        date: attendanceDateStr,
      }
      if (effectiveOrgId) {
        attendanceWhere.organizationId = effectiveOrgId
      }
      if (studentId) {
        attendanceWhere.studentId = studentId
      }

      const [records, students, presentCount, absentCount, lateCount, excusedCount, organizations, teachers] =
        await Promise.all([
          db.studentAttendance.findMany({
            where: attendanceWhere,
            orderBy: { createdAt: 'desc' },
          }),
          db.student.findMany({
            where: studentWhere,
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              organizationId: true,
              teacherId: true,
              organization: {
                select: { id: true, name: true, code: true },
              },
              teacher: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { name: 'asc' },
          }),
          db.studentAttendance.count({
            where: { ...attendanceWhere, status: 'present' },
          }),
          db.studentAttendance.count({
            where: { ...attendanceWhere, status: 'absent' },
          }),
          db.studentAttendance.count({
            where: { ...attendanceWhere, status: 'late' },
          }),
          db.studentAttendance.count({
            where: { ...attendanceWhere, status: 'excused' },
          }),
          isSuperAdmin
            ? db.organization.findMany({
                select: { id: true, name: true, code: true },
                orderBy: { name: 'asc' },
              })
            : Promise.resolve([]),
          isSuperAdmin
            ? db.user.findMany({
                where: { role: 'teacher' },
                select: { id: true, name: true, email: true, organizationId: true },
                orderBy: { name: 'asc' },
              })
            : Promise.resolve([]),
        ])

      // Build student map for quick lookup
      const studentMap = new Map(students.map((s) => [s.id, s]))

      // Format attendance records with student info
      const formattedRecords = records.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        student: studentMap.get(r.studentId) || null,
        date: r.date,
        status: r.status,
        notes: r.notes,
        markedBy: r.markedBy,
        markedByName: r.markedByName,
        createdAt: r.createdAt,
      }))

      // Build student attendance map (studentId -> status)
      const attendanceMap = new Map(records.map((r) => [r.studentId, r.status]))

      // Build full student list with attendance status
      const studentList = students.map((s) => ({
        ...s,
        attendanceStatus: attendanceMap.get(s.id) || null,
        attendanceId: records.find((r) => r.studentId === s.id)?.id || null,
        attendanceNotes: records.find((r) => r.studentId === s.id)?.notes || null,
      }))

      const totalStudents = students.length
      const totalMarked = records.length
      const attendanceRate = totalStudents > 0
        ? Math.round((presentCount / Math.max(totalMarked, 1)) * 100)
        : 0

      return NextResponse.json({
        success: true,
        type: 'attendance',
        data: {
          date: attendanceDateStr,
          students: studentList,
          records: formattedRecords,
          summary: {
            totalStudents,
            totalMarked,
            present: presentCount,
            absent: absentCount,
            late: lateCount,
            excused: excusedCount,
            attendanceRate,
          },
          organizations,
          teachers,
          isSuperAdmin,
        },
      })
    }

    // ── Notes data ──
    if (type === 'notes') {
      const notesWhere: any = {}
      if (studentId) {
        notesWhere.studentId = studentId
      }
      if (effectiveOrgId) {
        notesWhere.organizationId = effectiveOrgId
      }

      const [notes, students, organizations, teachers] = await Promise.all([
        db.studentNote.findMany({
          where: notesWhere,
          orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
          take: 100,
        }),
        db.student.findMany({
          where: studentWhere,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            organizationId: true,
            teacherId: true,
            organization: {
              select: { id: true, name: true },
            },
            teacher: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { name: 'asc' },
        }),
        isSuperAdmin
          ? db.organization.findMany({
              select: { id: true, name: true, code: true },
              orderBy: { name: 'asc' },
            })
          : Promise.resolve([]),
        isSuperAdmin
          ? db.user.findMany({
              where: { role: 'teacher' },
              select: { id: true, name: true, email: true, organizationId: true },
              orderBy: { name: 'asc' },
            })
          : Promise.resolve([]),
      ])

      // Build student map
      const studentMap = new Map(students.map((s) => [s.id, s]))

      const formattedNotes = notes.map((n) => ({
        id: n.id,
        studentId: n.studentId,
        student: studentMap.get(n.studentId) || null,
        note: n.note,
        category: n.category,
        priority: n.priority,
        createdBy: n.createdBy || n.addedBy,
        createdByName: n.createdByName || n.addedByName,
        isPinned: n.isPinned,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      }))

      return NextResponse.json({
        success: true,
        type: 'notes',
        data: {
          notes: formattedNotes,
          students,
          organizations,
          teachers,
          isSuperAdmin,
        },
      })
    }

    // ── Communications data ──
    if (type === 'communications') {
      const commWhere: any = {}
      if (studentId) {
        commWhere.studentId = studentId
      }
      if (effectiveOrgId) {
        commWhere.organizationId = effectiveOrgId
      }

      const [communications, students, organizations, teachers] = await Promise.all([
        db.studentCommunication.findMany({
          where: commWhere,
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
        db.student.findMany({
          where: studentWhere,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            organizationId: true,
            teacherId: true,
            organization: {
              select: { id: true, name: true },
            },
            teacher: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { name: 'asc' },
        }),
        isSuperAdmin
          ? db.organization.findMany({
              select: { id: true, name: true, code: true },
              orderBy: { name: 'asc' },
            })
          : Promise.resolve([]),
        isSuperAdmin
          ? db.user.findMany({
              where: { role: 'teacher' },
              select: { id: true, name: true, email: true, organizationId: true },
              orderBy: { name: 'asc' },
            })
          : Promise.resolve([]),
      ])

      // Build student map
      const studentMap = new Map(students.map((s) => [s.id, s]))

      const formattedComms = communications.map((c) => ({
        id: c.id,
        studentId: c.studentId,
        student: studentMap.get(c.studentId) || null,
        type: c.type,
        subject: c.subject,
        message: c.message,
        status: c.status,
        sentBy: c.sentBy,
        sentByName: c.sentByName,
        sentAt: c.sentAt,
        createdAt: c.createdAt,
      }))

      return NextResponse.json({
        success: true,
        type: 'communications',
        data: {
          communications: formattedComms,
          students,
          organizations,
          teachers,
          isSuperAdmin,
        },
      })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid type parameter. Use: attendance, notes, or communications' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Student management GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/student-mgmt
 * Mark attendance, add note, or send communication.
 * Accessible by platform_admin (Super Admin) and teachers.
 *
 * Body: { action: 'mark_attendance' | 'add_note' | 'send_communication', ...data }
 */
export async function POST(req: NextRequest) {
  try {
    // ── Auth check ──
    const authResult = await requireAdminOrTeacher(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const auth = authResult.user
    const isSuperAdmin = auth.role === 'platform_admin'
    const body = await req.json()
    const { action } = body

    // ── Mark Attendance ──
    if (action === 'mark_attendance') {
      const { studentIds, date, status, organizationId, notes } = body

      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return NextResponse.json(
          { success: false, message: 'studentIds array is required.' },
          { status: 400 }
        )
      }

      if (!status || !['present', 'absent', 'late', 'excused'].includes(status)) {
        return NextResponse.json(
          { success: false, message: 'Valid status is required: present, absent, late, or excused.' },
          { status: 400 }
        )
      }

      const targetOrgId = isSuperAdmin ? (organizationId || auth.orgId) : auth.orgId

      if (!targetOrgId) {
        return NextResponse.json(
          { success: false, message: 'organizationId is required.' },
          { status: 400 }
        )
      }

      // Parse date to YYYY-MM-DD string
      let attendanceDateStr: string
      if (date) {
        const parsed = new Date(date)
        if (isNaN(parsed.getTime())) {
          return NextResponse.json(
            { success: false, message: 'Invalid date format.' },
            { status: 400 }
          )
        }
        attendanceDateStr = parsed.toISOString().split('T')[0]
      } else {
        const now = new Date()
        attendanceDateStr = now.toISOString().split('T')[0]
      }

      // Verify students
      const studentWhere: any = {
        id: { in: studentIds },
      }
      if (!isSuperAdmin) {
        studentWhere.organizationId = targetOrgId
      }

      const students = await db.student.findMany({
        where: studentWhere,
        select: { id: true, organizationId: true },
      })

      if (students.length === 0) {
        return NextResponse.json(
          { success: false, message: 'No valid students found.' },
          { status: 404 }
        )
      }

      // Upsert attendance records (one per student per day)
      const results: unknown[] = []
      for (const std of students) {
        const record = await db.studentAttendance.upsert({
          where: {
            studentId_date: {
              studentId: std.id,
              date: attendanceDateStr,
            },
          },
          update: {
            status,
            notes: notes || null,
            markedBy: auth.id,
            markedByName: auth.name,
          },
          create: {
            studentId: std.id,
            organizationId: std.organizationId || targetOrgId,
            date: attendanceDateStr,
            status,
            notes: notes || null,
            markedBy: auth.id,
            markedByName: auth.name,
          },
        })
        results.push(record)
      }

      return NextResponse.json({
        success: true,
        message: `Attendance marked for ${results.length} student(s).`,
        data: { updated: results.length },
      })
    }

    // ── Add Note ──
    if (action === 'add_note') {
      const { studentId, note, category, priority } = body

      if (!studentId) {
        return NextResponse.json(
          { success: false, message: 'studentId is required.' },
          { status: 400 }
        )
      }

      if (!note || !note.trim()) {
        return NextResponse.json(
          { success: false, message: 'Note text is required.' },
          { status: 400 }
        )
      }

      // Verify student exists
      const student = await db.student.findUnique({
        where: { id: studentId },
        select: { id: true, name: true, organizationId: true },
      })

      if (!student) {
        return NextResponse.json(
          { success: false, message: 'Student not found.' },
          { status: 404 }
        )
      }

      // If not super admin, ensure student belongs to user's org
      if (!isSuperAdmin && auth.orgId && student.organizationId !== auth.orgId) {
        return NextResponse.json(
          { success: false, message: 'Access denied to this student record.' },
          { status: 403 }
        )
      }

      const validCategories = ['general', 'academic', 'behavioral', 'financial', 'communication']
      const validPriorities = ['normal', 'important', 'urgent']

      const studentNote = await db.studentNote.create({
        data: {
          studentId,
          organizationId: student.organizationId,
          note: note.trim(),
          category: validCategories.includes(category) ? category : 'general',
          priority: validPriorities.includes(priority) ? priority : 'normal',
          createdBy: auth.id,
          createdByName: auth.name,
          addedBy: auth.id,
          addedByName: auth.name,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Note added successfully.',
        data: studentNote,
      })
    }

    // ── Send Communication ──
    if (action === 'send_communication') {
      const { studentId, type: commType, subject, message, organizationId } = body

      if (!studentId) {
        return NextResponse.json(
          { success: false, message: 'studentId is required.' },
          { status: 400 }
        )
      }

      if (!message || !message.trim()) {
        return NextResponse.json(
          { success: false, message: 'Message text is required.' },
          { status: 400 }
        )
      }

      // Verify student exists
      const student = await db.student.findUnique({
        where: { id: studentId },
        select: { id: true, name: true, email: true, organizationId: true },
      })

      if (!student) {
        return NextResponse.json(
          { success: false, message: 'Student not found.' },
          { status: 404 }
        )
      }

      const targetOrgId = organizationId || student.organizationId || auth.orgId

      const validTypes = ['email', 'sms', 'whatsapp', 'push']

      const communication = await db.studentCommunication.create({
        data: {
          studentId,
          organizationId: targetOrgId,
          type: validTypes.includes(commType) ? commType : 'email',
          subject: subject?.trim() || null,
          message: message.trim(),
          status: 'sent',
          sentBy: auth.id,
          sentByName: auth.name,
          sentAt: new Date(),
        },
      })

      // Try to actually send email if type is email
      if (commType === 'email' && student.email) {
        try {
          const { sendEmail } = await import('@/lib/email')
          await sendEmail({
            to: student.email,
            subject: subject?.trim() || `Message from ${auth.name || 'Admin'}`,
            body: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h3 style="color: #4f46e5;">Message from ${auth.name || 'Faculty / Admin'}</h3>
              <p>Hello <strong>${student.name}</strong>,</p>
              <p style="white-space: pre-line; color: #333; line-height: 1.6;">${message.trim()}</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="color: #999; font-size: 12px;">This message was sent via the educational portal.</p>
            </div>`,
            type: 'notification',
          })
        } catch (emailErr) {
          console.error('Failed to send email:', emailErr)
          await db.studentCommunication.update({
            where: { id: communication.id },
            data: { status: 'failed' },
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Communication sent successfully.',
        data: communication,
      })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action. Use: mark_attendance, add_note, or send_communication' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Student management POST error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/student-mgmt
 * Update a note (pin/unpin) or update communication status.
 */
export async function PUT(req: NextRequest) {
  try {
    const authResult = await requireAdminOrTeacher(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await req.json()
    const { action } = body

    // ── Toggle Pin Note ──
    if (action === 'toggle_pin_note') {
      const { noteId } = body
      if (!noteId) {
        return NextResponse.json(
          { success: false, message: 'noteId is required.' },
          { status: 400 }
        )
      }

      const note = await db.studentNote.findUnique({ where: { id: noteId } })
      if (!note) {
        return NextResponse.json(
          { success: false, message: 'Note not found.' },
          { status: 404 }
        )
      }

      const updated = await db.studentNote.update({
        where: { id: noteId },
        data: { isPinned: !note.isPinned },
      })

      return NextResponse.json({
        success: true,
        message: updated.isPinned ? 'Note pinned.' : 'Note unpinned.',
        data: updated,
      })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Student management PUT error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/student-mgmt
 * Delete a note.
 */
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireAdminOrTeacher(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const { searchParams } = new URL(req.url)
    const noteId = searchParams.get('noteId')?.trim() || ''

    if (!noteId) {
      return NextResponse.json(
        { success: false, message: 'noteId is required.' },
        { status: 400 }
      )
    }

    const note = await db.studentNote.findUnique({ where: { id: noteId } })
    if (!note) {
      return NextResponse.json(
        { success: false, message: 'Note not found.' },
        { status: 404 }
      )
    }

    await db.studentNote.delete({ where: { id: noteId } })

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully.',
    })
  } catch (error) {
    console.error('Student management DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
