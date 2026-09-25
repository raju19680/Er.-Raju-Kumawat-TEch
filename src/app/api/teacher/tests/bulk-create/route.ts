import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req)
    if (!user || user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, testSeriesId, questionIds } = await req.json()

    if (!title || !testSeriesId || !questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ error: 'Missing required fields or no questions selected' }, { status: 400 })
    }

    // Ensure the test series belongs to the organization
    const testSeries = await prisma.testSeries.findFirst({
      where: {
        id: testSeriesId,
        organizationId: user.organizationId
      }
    })

    if (!testSeries) {
      return NextResponse.json({ error: 'Test Series not found or unauthorized' }, { status: 404 })
    }

    // Get the highest sortOrder for existing tests in this series to append to the end
    const lastTest = await prisma.test.findFirst({
      where: { testSeriesId },
      orderBy: { sortOrder: 'desc' }
    })
    const newTestSortOrder = lastTest ? lastTest.sortOrder + 1 : 1

    // Fetch the actual questions to duplicate
    const sourceQuestions = await prisma.question.findMany({
      where: {
        id: { in: questionIds }
      }
    })

    if (sourceQuestions.length === 0) {
      return NextResponse.json({ error: 'Questions not found' }, { status: 404 })
    }

    let totalMarks = 0
    let totalQuestions = sourceQuestions.length

    sourceQuestions.forEach(q => {
      totalMarks += q.positiveMarks
    })

    // Create the test and duplicate questions in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create new Test
      const newTest = await tx.test.create({
        data: {
          title,
          testSeriesId,
          organizationId: user.organizationId,
          sortOrder: newTestSortOrder,
          numberOfQuestions: totalQuestions,
          totalMarks,
          status: 'draft',
          isLive: false,
          totalDuration: 60 // Default 60 mins
        }
      })

      // Prepare question data for duplication
      const newQuestionsData = sourceQuestions.map((q, index) => {
        // Exclude fields we don't want to copy or that need new values
        const { id, testId, createdAt, updatedAt, ...restOfQuestion } = q
        
        return {
          ...restOfQuestion,
          testId: newTest.id,
          sortOrder: index + 1 // Re-order them starting from 1
        }
      })

      // Insert duplicated questions
      await tx.question.createMany({
        data: newQuestionsData
      })

      return newTest
    })

    return NextResponse.json({ success: true, test: result })

  } catch (error: any) {
    console.error('Bulk Create Test Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}