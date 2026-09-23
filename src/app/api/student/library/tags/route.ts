import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function POST(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const { name, color } = await req.json()

    if (!name) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 })
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    const tag = await db.tag.create({
      data: {
        name,
        slug,
        color,
        organizationId: auth.orgId,
      }
    })

    return NextResponse.json({
      success: true,
      data: tag
    })
  } catch (error) {
    console.error('Student library tag POST error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
