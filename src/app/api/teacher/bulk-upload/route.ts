export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'

export async function POST(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'bulk-uploader')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const testId = formData.get('testId') as string | null
    const format = formData.get('format') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 })
    }

    // Verify test exists
    const test = await db.test.findUnique({ where: { id: testId } })
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    const fileContent = await file.text()

    // Try parsing as JSON first
    let questions: Record<string, unknown>[] = []
    try {
      const parsed = JSON.parse(fileContent)
      if (Array.isArray(parsed)) {
        questions = parsed
      } else {
        return NextResponse.json({ error: 'JSON file must contain an array of questions' }, { status: 400 })
      }
    } catch {
      // Try simple CSV parsing
      const lines = fileContent.trim().split('\n')
      if (lines.length < 2) {
        return NextResponse.json({ error: 'File must contain at least a header row and one data row' }, { status: 400 })
      }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const obj: Record<string, string> = {}
        headers.forEach((h, idx) => {
          obj[h] = values[idx] || ''
        })
        questions.push(obj)
      }
    }

    // Create questions from parsed data
    let created = 0
    let errors: string[] = []

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      try {
        const title = (q.title || q.question || '') as string
        if (!title) {
          errors.push(`Row ${i + 1}: Missing question text`)
          continue
        }

        const type = ((q.type as string) || format || 'mcq').toLowerCase()
        const section = (q.section as string) || null
        const positiveMarks = Number(q.positiveMarks) || 1
        const negativeMarks = Number(q.negativeMarks) || 0
        const correctOption = (q.correctOption as string) || (q.answer as string) || null

        await db.question.create({
          data: {
            type,
            title,
            section,
            heading: (q.heading as string) || null,
            option1: (q.option1 as string) || null,
            option2: (q.option2 as string) || null,
            option3: (q.option3 as string) || null,
            option4: (q.option4 as string) || null,
            option5: (q.option5 as string) || null,
            correctOption,
            positiveMarks,
            negativeMarks,
            solutionHeading: (q.solutionHeading as string) || null,
            solutionText: (q.solutionText as string) || null,
            solutionVideo: (q.solutionVideo as string) || null,
            testId,
          },
        })
        created++
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        errors.push(`Row ${i + 1}: Failed to create question - ${msg}`)
      }
    }

    // Update test question count
    const questionCount = await db.question.count({ where: { testId } })
    await db.test.update({
      where: { id: testId },
      data: { numberOfQuestions: questionCount },
    })

    return NextResponse.json({
      success: true,
      message: `Uploaded ${created} of ${questions.length} questions`,
      created,
      total: questions.length,
      errors: errors.length > 0 ? errors : undefined,
    }, { status: 201 })
  } catch (error) {
    console.error('Bulk upload failed:', error)
    return NextResponse.json({ error: 'Bulk upload failed' }, { status: 500 })
  }
}

