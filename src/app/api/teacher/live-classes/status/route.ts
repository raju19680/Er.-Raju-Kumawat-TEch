export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthTeacher } from '@/lib/auth-helpers'

export async function POST(req: NextRequest) {
  try {
    const { auth, teacher, error, status } = await getAuthTeacher(req)
    if (error || !teacher || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const { classId, classStatus } = await req.json()
    if (!classId || !classStatus) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 })
    }

    const updatedClass = await db.liveClass.update({
      where: { id: classId },
      data: { status: classStatus }
    })

    return NextResponse.json({ success: true, data: updatedClass })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}

