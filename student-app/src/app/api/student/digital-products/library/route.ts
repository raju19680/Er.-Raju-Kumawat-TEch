import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    const normalizedRole = String(auth.role).toLowerCase()
    const isStudent = normalizedRole === 'student'
    const isTeacher = ['teacher', 'org_admin', 'admin', 'platform_admin'].includes(normalizedRole)
    if (!isStudent && !isTeacher) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    const student = await db.student.findFirst({
      where: { userId: auth.id },
    })
    if (!student && auth.role === 'student') {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 })
    }
    const studentId = student?.id || null;

    // Get purchased digital products with product details
    if (!db.purchasedDigitalProduct) {
      return NextResponse.json({ success: true, products: [] })
    }
    const purchasedProducts = await db.purchasedDigitalProduct.findMany({
      where: { studentId: studentId || 'admin-bypass' },
      select: {
        id: true,
        digitalProductId: true,
        accessUrl: true,
        expiresAt: true,
        createdAt: true,
        digitalProduct: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            file: true,
            type: true,
            category: true,
            price: true,
            mrp: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = purchasedProducts.map((pp) => ({
      id: pp.id,
      digitalProductId: pp.digitalProductId,
      accessUrl: pp.accessUrl,
      expiresAt: pp.expiresAt,
      createdAt: pp.createdAt,
      digitalProduct: pp.digitalProduct,
    }))

    return NextResponse.json({ success: true, products: formatted })
  } catch (error) {
    console.error('Student library list error:', error)
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 })
  }
}
