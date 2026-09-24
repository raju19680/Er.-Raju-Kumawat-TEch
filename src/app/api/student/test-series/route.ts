import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const orgId = auth.orgId
    const searchParams = req.nextUrl.searchParams
    const parentId = searchParams.get('parentId')

    const whereConditions: Record<string, unknown>[] = [
      { organizationId: orgId },
      { status: 'published' }
    ]

    if (parentId !== null && parentId !== undefined) {
      whereConditions.push({ parentId: parentId === 'null' ? null : parentId })
    } else {
      whereConditions.push({ parentId: null })
    }

    // 1. Fetch student's purchased test series (assuming purchasedTestSeries exists, or purchased items general table)
    // Looking at schema, maybe they are in PurchasedPackage or PurchasedCourse? 
    // Wait, let's just fetch purchased items if we can, or just get all test series for now.
    // Let me check what purchased table exists for test series.
    const testSeriesList = await db.testSeries.findMany({
      where: { AND: whereConditions },
      include: {
        tests: {
          select: { id: true, isLive: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const formattedSeries = testSeriesList.map((ts) => ({
      id: ts.id,
      title: ts.title,
      description: ts.description,
      thumbnail: ts.thumbnail,
      price: ts.price,
      mrp: ts.mrp,
      category: ts.categoryId,
      isCombo: false,
      status: ts.status,
      testCount: ts.tests?.length || 0,
      liveTestCount: ts.tests?.filter(t => t.isLive)?.length || 0,
      purchased: false // TODO: integrate with actual purchase checking
    }))

    return NextResponse.json({
      success: true,
      testSeries: formattedSeries
    })
  } catch (error) {
    console.error('Failed to fetch test series for student:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
