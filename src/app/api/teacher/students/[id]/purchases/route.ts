export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'
import { getDemoOrgId } from '@/lib/demo-org'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'students')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const orgId = await getDemoOrgId(request)

    const [courses, testSeries, digitalProducts] = await Promise.all([
      db.course.findMany({ where: { organizationId: orgId, status: 'published' }, select: { id: true, title: true, price: true } }),
      db.testSeries.findMany({ where: { organizationId: orgId, status: 'published' }, select: { id: true, title: true, price: true } }),
      db.digitalProduct.findMany({ where: { organizationId: orgId, status: 'published' }, select: { id: true, title: true, price: true } })
    ])

    return NextResponse.json({ success: true, courses, testSeries, digitalProducts })
  } catch (error) {
    console.error('Failed to fetch available products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'students')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id } = await params
    const body = await request.json()
    const { type, productId } = body

    if (!type || !productId) {
      return NextResponse.json({ error: 'Type and Product ID are required' }, { status: 400 })
    }

    const student = await db.student.findUnique({ where: { id } })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const orgId = await getDemoOrgId(request)
    
    // Check if product exists and get details
    let title = ''
    if (type === 'COURSE') {
      const course = await db.course.findUnique({ where: { id: productId } })
      if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      title = course.title
      
      const existing = await db.purchasedCourse.findFirst({
        where: { studentId: id, courseId: productId }
      })
      if (existing) return NextResponse.json({ error: 'Student already has this course' }, { status: 400 })
      
      await db.purchasedCourse.create({
        data: {
          studentId: id,
          courseId: productId,
          organizationId: orgId
        }
      })
    } else if (type === 'TEST_SERIES') {
      const testSeries = await db.testSeries.findUnique({ where: { id: productId } })
      if (!testSeries) return NextResponse.json({ error: 'Test Series not found' }, { status: 404 })
      title = testSeries.title
      
      const existing = await db.purchasedTestSeries.findFirst({
        where: { studentId: id, testSeriesId: productId }
      })
      if (existing) return NextResponse.json({ error: 'Student already has this test series' }, { status: 400 })
      
      await db.purchasedTestSeries.create({
        data: {
          studentId: id,
          testSeriesId: productId,
          organizationId: orgId
        }
      })
    } else if (type === 'DIGITAL_PRODUCT') {
      const dp = await db.digitalProduct.findUnique({ where: { id: productId } })
      if (!dp) return NextResponse.json({ error: 'Digital Product not found' }, { status: 404 })
      title = dp.title
      
      const existing = await db.purchasedDigitalProduct.findFirst({
        where: { studentId: id, digitalProductId: productId }
      })
      if (existing) return NextResponse.json({ error: 'Student already has this digital product' }, { status: 400 })
      
      await db.purchasedDigitalProduct.create({
        data: {
          studentId: id,
          digitalProductId: productId
        }
      })
    } else {
      return NextResponse.json({ error: 'Invalid product type' }, { status: 400 })
    }

    // Create a free order for record keeping
    await db.order.create({
      data: {
        studentId: id,
        organizationId: orgId,
        totalAmount: 0,
        finalAmount: 0,
        status: 'completed',
        items: JSON.stringify([{ type, productId, title, price: 0 }])
      }
    })

    return NextResponse.json({ success: true, message: `Successfully assigned ${title} to student` })
  } catch (error) {
    console.error('Failed to assign product:', error)
    return NextResponse.json({ error: 'Failed to assign product' }, { status: 500 })
  }
}


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'students')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const productId = searchParams.get('productId')

    if (!type || !productId) {
      return NextResponse.json({ error: 'Type and Product ID are required' }, { status: 400 })
    }

    const student = await db.student.findUnique({ where: { id } })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    let deleted = false

    if (type === 'COURSE') {
      const existing = await db.purchasedCourse.findFirst({
        where: { studentId: id, courseId: productId }
      })
      if (existing) {
        await db.purchasedCourse.delete({ where: { id: existing.id } })
        deleted = true
      }
    } else if (type === 'TEST_SERIES') {
      const existing = await db.purchasedTestSeries.findFirst({
        where: { studentId: id, testSeriesId: productId }
      })
      if (existing) {
        await db.purchasedTestSeries.delete({ where: { id: existing.id } })
        deleted = true
      }
    } else if (type === 'DIGITAL_PRODUCT') {
      const existing = await db.purchasedDigitalProduct.findFirst({
        where: { studentId: id, digitalProductId: productId }
      })
      if (existing) {
        await db.purchasedDigitalProduct.delete({ where: { id: existing.id } })
        deleted = true
      }
    } else {
      return NextResponse.json({ error: 'Invalid product type' }, { status: 400 })
    }

    if (!deleted) {
      return NextResponse.json({ error: 'Product not found in student purchases' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Successfully revoked access' })
  } catch (error) {
    console.error('Failed to revoke product:', error)
    return NextResponse.json({ error: 'Failed to revoke product' }, { status: 500 })
  }
}
