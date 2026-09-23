import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    // Get purchased digital products with product details
    if (!db.purchasedDigitalProduct) {
      return NextResponse.json({ success: true, products: [] })
    }
    const purchasedProducts = await db.purchasedDigitalProduct.findMany({
      where: { studentId: student.id },
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
