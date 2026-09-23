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

    // Parse query params for filtering
    const { searchParams } = new URL(req.url)
    const typeFilter = searchParams.get('type') // ebook, notes, test_series, other
    const searchQuery = searchParams.get('search') || ''

    // Build where clause
    const where: any = {
      organizationId: auth.orgId,
      status: 'published',
    }

    // Filter by type — only show ebook, notes, other (not course or test_series which have their own sections)
    if (typeFilter && typeFilter !== 'all') {
      where.type = typeFilter
    } else {
      // By default, show only non-course and non-test_series digital products in the store
      where.type = { in: ['ebook', 'notes', 'other'] }
    }

    // Search by title
    if (searchQuery) {
      where.title = { contains: searchQuery }
    }

    // Get digital products
    const digitalProducts = await db.digitalProduct.findMany({
      where,
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
        status: true,
        featured: true,
        createdAt: true,
      },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // Get purchased digital product IDs
    const purchasedProductIds = new Set<string>()
    if (db.purchasedDigitalProduct) {
      const purchasedProducts = await db.purchasedDigitalProduct.findMany({
        where: { studentId: studentId || 'admin-bypass' },
        select: { digitalProductId: true },
      })
      purchasedProducts.forEach(p => purchasedProductIds.add(p.digitalProductId))
    }

    // Also check completed orders as fallback
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
            if (item.itemType === 'digital_product' && item.itemId) {
              purchasedProductIds.add(item.itemId)
            }
          }
        }
      } catch {
        // ignore parse errors
      }
    }

    const formatted = digitalProducts.map((product) => ({
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
      purchased: (auth.role === 'teacher' || auth.role === 'platform_admin') ? true : purchasedProductIds.has(product.id),
    }))

    return NextResponse.json({ success: true, products: formatted })
  } catch (error) {
    console.error('Student digital products list error:', error)
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 })
  }
}
