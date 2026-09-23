export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifyAuth(req)
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const testSeries = await prisma.testSeries.findUnique({
      where: {
        id,
        ...(session.organizationId ? { organizationId: session.organizationId } : {})
      }
    })

    if (!testSeries) {
      return NextResponse.json({ success: false, message: 'Test Series not found' }, { status: 404 })
    }

    // Count the actual tests linked to this Test Series
    const actualTestCount = await prisma.test.count({
      where: {
        testSeriesId: id
      }
    })

    // If TestSeries had a cached totalTests field we would update it here
    // For now we just return the calculation
    /*
    await prisma.testSeries.update({
      where: { id },
      data: { totalTests: actualTestCount }
    })
    */

    return NextResponse.json({ 
      success: true, 
      message: 'Test count recalculated successfully',
      count: actualTestCount
    })
  } catch (error) {
    console.error('Error recalculating test count:', error)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}

