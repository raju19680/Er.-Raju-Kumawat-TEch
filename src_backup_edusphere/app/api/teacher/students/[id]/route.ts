import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// DELETE - Remove a student from teacher's roster
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const student = await db.user.findFirst({
      where: { id, role: 'STUDENT', teacherId: session.id },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Unassign from teacher (don't delete the student account)
    await db.user.update({
      where: { id },
      data: { teacherId: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove student error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
