export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'test-series')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id } = await params
    const testSeries = await db.testSeries.findUnique({
      where: { id },
      include: {
        tests: {
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: { select: { questions: true, testAttempts: true } },
          },
        },
        _count: { select: { tests: true } },
      },
    })

    if (!testSeries) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(testSeries)
  } catch (error) {
    console.error('Failed to fetch test series:', error)
    return NextResponse.json({ error: 'Failed to fetch test series' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'test-series')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id } = await params
    const body = await request.json()

    // Verify test series exists
    const existing = await db.testSeries.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Build update data with only provided fields
    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description || null
    if (body.thumbnail !== undefined) updateData.thumbnail = body.thumbnail || null
    if (body.price !== undefined) updateData.price = body.price
    if (body.mrp !== undefined) updateData.mrp = body.mrp
    if (body.discount !== undefined) updateData.discount = body.discount
    if (body.category !== undefined) updateData.category = body.category || null
    if (body.isCombo !== undefined) updateData.isCombo = body.isCombo
    if (body.includeTestMaker !== undefined) updateData.includeTestMaker = body.includeTestMaker
    if (body.allowPayment !== undefined) updateData.allowPayment = body.allowPayment
    if (body.validityMode !== undefined) updateData.validityMode = body.validityMode
    if (body.validityDays !== undefined) updateData.validityDays = body.validityDays || null
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null
    if (body.seoTitle !== undefined) updateData.seoTitle = body.seoTitle || null
    if (body.seoDescription !== undefined) updateData.seoDescription = body.seoDescription || null
    if (body.richSnippets !== undefined) updateData.richSnippets = body.richSnippets
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder
    if (body.status !== undefined) updateData.status = body.status

    const testSeries = await db.testSeries.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, testSeries })
  } catch (error) {
    console.error('Failed to update test series:', error)
    return NextResponse.json({ error: 'Failed to update test series' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'test-series')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { id } = await params

    // Verify test series exists
    const existing = await db.testSeries.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Delete all related tests and their questions first
    const tests = await db.test.findMany({
      where: { testSeriesId: id },
      select: { id: true },
    })
    const testIds = tests.map(t => t.id)

    // Delete in order: questions → test attempts → tests → test series
    if (testIds.length > 0) {
      await db.question.deleteMany({ where: { testId: { in: testIds } } })
      await db.testAttempt.deleteMany({ where: { testId: { in: testIds } } })
      await db.test.deleteMany({ where: { id: { in: testIds } } })
    }

    await db.testSeries.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Test series deleted' })
  } catch (error) {
    console.error('Failed to delete test series:', error)
    return NextResponse.json({ error: 'Failed to delete test series' }, { status: 500 })
  }
}

