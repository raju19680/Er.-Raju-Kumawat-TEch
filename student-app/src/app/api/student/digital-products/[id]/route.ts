import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const student = await db.student.findFirst({
      where: { userId: auth.id },
    })
    if (!student && auth.role === 'student') {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 })
    }
    const studentId = student?.id || null;

    // Get digital product detail
    const product = await db.digitalProduct.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 })
    }

    // Check if student has purchased this product
    let purchase: any = null
    if (db.purchasedDigitalProduct) {
      purchase = await db.purchasedDigitalProduct.findUnique({
        where: {
          studentId_digitalProductId: {
            studentId: studentId || 'admin-bypass',
            digitalProductId: product.id,
          },
        },
      })
    }

    // Also check completed orders as fallback
    let purchasedViaOrder = false
    if (!purchase) {
      const completedOrders = await db.order.findMany({
        where: {
          studentId: studentId || 'admin-bypass',
          status: 'completed',
        },
        select: { items: true },
      })

      for (const order of completedOrders) {
        try {
          const items = JSON.parse(order.items)
          if (Array.isArray(items)) {
            for (const item of items) {
              if (item.itemType === 'digital_product' && item.itemId === product.id) {
                purchasedViaOrder = true
                break
              }
            }
          }
        } catch {
          // ignore parse errors
        }
        if (purchasedViaOrder) break
      }
    }

    const isPurchased = (auth.role === 'teacher' || auth.role === 'platform_admin') ? true : (!!purchase || purchasedViaOrder)

    const formatted = {
      id: product.id,
      title: product.title,
      description: product.description,
      thumbnail: product.thumbnail,
      file: product.file,
      type: product.type,
      category: product.category,
      price: product.price,
      mrp: product.mrp,
      status: product.status,
      featured: product.featured,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      purchased: isPurchased,
      purchaseDate: purchase?.createdAt || null,
      accessUrl: purchase?.accessUrl || product.file || null,
      expiresAt: null,
    }

    return NextResponse.json({ success: true, product: formatted })
  } catch (error: any) {
    console.error('Student digital product detail error:', error)
    return NextResponse.json({ success: false, message: error?.message || 'Something went wrong' }, { status: 500 })
  }
}
