import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

// GET - Get notes / digital product content (for students who purchased or free)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await getAuthUser(req)

    if (!auth || auth.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student = await db.student.findFirst({
      where: { userId: auth.id },
    })

    const product = await db.digitalProduct.findUnique({
      where: { id },
      include: {
        organization: {
          select: { id: true, name: true, logo: true },
        },
      },
    })

    if (!product || product.status !== 'published') {
      return NextResponse.json({ error: 'Notes not found' }, { status: 404 })
    }

    // Check if student purchased (or it's free)
    let hasAccess = product.price === 0
    if (!hasAccess && student) {
      const purchase = await db.purchasedDigitalProduct.findUnique({
        where: {
          studentId_digitalProductId: {
            studentId: student.id,
            digitalProductId: id,
          },
        },
      })
      hasAccess = !!purchase
    }

    return NextResponse.json({
      notes: {
        ...product,
        content: hasAccess ? product.file : '[Purchase these notes to access the full content]',
        hasAccess,
      },
    })
  } catch (error) {
    console.error('Get notes detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
