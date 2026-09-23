export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'
import { resolveOrgId } from '@/lib/demo-org'

export async function GET(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'tests')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const searchParams = request.nextUrl.searchParams
    const orgId = await resolveOrgId(request, searchParams.get('organizationId') || undefined)
    const statusFilter = searchParams.get('status') || 'omr_pending'

    const attempts = await db.testAttempt.findMany({
      where: {
        status: statusFilter,
        test: {
          testSeries: {
            organizationId: orgId,
          },
        },
      },
      include: {
        student: {
          select: { id: true, name: true, email: true, phone: true },
        },
        test: {
          select: {
            id: true,
            title: true,
            totalMarks: true,
            testMode: true,
            testSeries: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    })

    return NextResponse.json({ items: attempts, total: attempts.length })
  } catch (error) {
    console.error('Failed to fetch OMR reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch OMR reviews' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'tests')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()
    const { attemptId, score, status = 'completed', answers } = body

    if (!attemptId) {
      return NextResponse.json({ error: 'Attempt ID is required' }, { status: 400 })
    }

    const existing = await db.testAttempt.findUnique({
      where: { id: attemptId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Test attempt not found' }, { status: 404 })
    }

    const parsedScore = score !== undefined ? Number(score) : existing.score

    const updatedAttempt = await db.testAttempt.update({
      where: { id: attemptId },
      data: {
        score: isNaN(parsedScore) ? 0 : parsedScore,
        status: status || 'completed',
        completedAt: new Date(),
        ...(answers !== undefined && {
          answers: typeof answers === 'string' ? answers : JSON.stringify(answers),
        }),
      },
      include: {
        student: {
          select: { id: true, name: true, email: true, phone: true },
        },
        test: {
          select: {
            id: true,
            title: true,
            totalMarks: true,
            testMode: true,
            testSeries: { select: { id: true, title: true } },
          },
        },
      },
    })

    return NextResponse.json(updatedAttempt)
  } catch (error) {
    console.error('Failed to update OMR review:', error)
    return NextResponse.json({ error: 'Failed to update OMR review' }, { status: 500 })
  }
}

