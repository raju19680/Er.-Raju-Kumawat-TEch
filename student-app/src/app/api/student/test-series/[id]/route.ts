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

    const testSeries = await db.testSeries.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        price: true,
        mrp: true,
        category: true,
        isCombo: true,
        status: true,
        parentId: true,
        parent: {
          select: {
            parentId: true,
            parent: {
              select: { parentId: true }
            }
          }
        },
        children: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            status: true,
          }
        },
        tests: {
          select: {
            id: true,
            title: true,
            totalDuration: true,
            numberOfQuestions: true,
            totalMarks: true,
            isLive: true,
            isLocked: true,
              isPdfTest: true,
              pdfUrl: true,
              testMode: true,
              allowPdfDownload: true,
              pdfPasswordProtected: true,
            maxAttempts: true,
            allowAttempt: true,
            displayResults: true,
            resultAt: true,
            negativeMarks: true,
            sortOrder: true,
            startDate: true,
            endDate: true,
            testAttempts: {
              where: { studentId: studentId || 'admin-bypass' },
              select: {
                id: true,
                score: true,
                totalMarks: true,
                status: true,
                startedAt: true,
                completedAt: true,
              },
              orderBy: { startedAt: 'desc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!testSeries) {
      return NextResponse.json({ success: false, message: 'Test series not found' }, { status: 404 })
    }

    // Check purchase status via PurchasedTestSeries table (Teachers and Admins bypass)
    let purchased = false
    if (auth.role === 'teacher' || auth.role === 'platform_admin') {
      purchased = true
    } else {
      const purchasedRecord = await db.purchasedTestSeries.findFirst({
        where: {
          studentId: studentId || 'admin-bypass',
          testSeriesId: { in: [id, testSeries.parentId, testSeries.parent?.parentId, testSeries.parent?.parent?.parentId].filter(Boolean) as string[] },
        },
      })

      if (purchasedRecord || testSeries.price === 0) {
        purchased = true
      } else {
        // Also check completed orders as fallback
        const completedOrders = await db.order.findMany({
          where: {
            studentId: studentId || 'admin-bypass',
            status: 'completed',
          },
          select: { items: true },
        })

        const idsToCheck = new Set([id, testSeries.parentId, testSeries.parent?.parentId, testSeries.parent?.parent?.parentId].filter(Boolean))

        for (const order of completedOrders) {
          try {
            const items = JSON.parse(order.items)
            if (Array.isArray(items)) {
              for (const item of items) {
                if (item.itemType === 'test_series' && item.itemId && idsToCheck.has(item.itemId)) {
                  purchased = true
                  break
                }
              }
            }
          } catch {
            // ignore parse errors
          }
          if (purchased) break
        }
      }
    }

    const formattedTests = testSeries.tests.map((test) => {
      const completedAttempts = test.testAttempts.filter(a => a.status === 'completed' && !(a as any).isPractice).length
      
      const now = new Date()
      let dateValid = true
      if (test.startDate && now < test.startDate) dateValid = false
      if (test.endDate && now > test.endDate) dateValid = false

      // Note: we now allow practice attempts even if completedAttempts >= maxAttempts
      // But we still require the test to be purchased, live, unlocked, and within date bounds
      const canAttempt = test.isLive && !test.isLocked && purchased && test.allowAttempt && dateValid

      return {
        id: test.id,
        title: test.title,
        totalDuration: test.totalDuration,
        numberOfQuestions: test.numberOfQuestions,
        totalMarks: test.totalMarks,
        isLive: test.isLive,
        isLocked: test.isLocked,
          isPdfTest: test.isPdfTest,
          pdfUrl: test.pdfUrl,
          testMode: test.testMode,
          allowPdfDownload: test.allowPdfDownload,
          pdfPasswordProtected: test.pdfPasswordProtected,
        maxAttempts: test.maxAttempts,
        allowAttempt: test.allowAttempt,
        displayResults: test.displayResults,
        resultAt: test.resultAt,
        negativeMarks: test.negativeMarks,
        startDate: test.startDate,
        endDate: test.endDate,
        attemptCount: test.testAttempts.length,
        attempts: test.testAttempts,
        canAttempt: canAttempt,
      }
    })

    return NextResponse.json({
      success: true,
      testSeries: {
        id: testSeries.id,
        title: testSeries.title,
        description: testSeries.description,
        thumbnail: testSeries.thumbnail,
        price: testSeries.price,
        mrp: testSeries.mrp,
        category: testSeries.category,
        isCombo: testSeries.isCombo,
        status: testSeries.status,
        purchased,
        children: testSeries.children,
        tests: formattedTests,
      },
    })
  } catch (error) {
    console.error('Student test-series detail error:', error)
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 })
  }
}
