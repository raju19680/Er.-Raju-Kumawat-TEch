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

    const { type, items } = await req.json()

    if (!type || !items || !Array.isArray(items)) {
      return NextResponse.json({ success: false, message: 'Missing type or items array' }, { status: 400 })
    }

    if (type === 'module') {
      // Reorder modules
      const updates = items.map((item: { id: string, sortOrder: number }) => {
        return db.courseModule.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder }
        })
      })
      await db.$transaction(updates)
    } else if (type === 'lesson') {
      // Reorder lessons
      const updates = items.map((item: { id: string, sortOrder: number, moduleId?: string }) => {
        return db.courseLesson.update({
          where: { id: item.id },
          data: { 
            sortOrder: item.sortOrder,
            ...(item.moduleId ? { moduleId: item.moduleId } : {}) // Update parent if moved
          }
        })
      })
      await db.$transaction(updates)
    } else {
      return NextResponse.json({ success: false, message: 'Invalid type. Use "module" or "lesson".' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `${type}s reordered successfully`
    })
  } catch (error) {
    console.error('Teacher course builder reorder POST error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

