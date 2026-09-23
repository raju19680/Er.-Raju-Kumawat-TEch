import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminOrTeacher } from '@/lib/auth-helpers'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminOrTeacher(req)
    if (authResult.error) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status })
    }
    const auth = authResult.user
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { searchParams } = new URL(req.url)
    const withSolution = searchParams.get('solutions') === 'true'

    const test = await db.test.findUnique({
      where: {
        id,
        organizationId: auth.orgId || ''
      },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
          include: {
            question: true
          }
        }
      }
    })

    if (!test) {
      return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 })
    }

    const pdfDoc = await PDFDocument.create()
    let page = pdfDoc.addPage([595.28, 841.89]) // A4
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
    
    // Fallback simple clean string
    const sanitizeText = (html: string | null) => {
      if (!html) return ''
      return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').substring(0, 100)
    }

    let y = 800

    // Title Header
    page.drawText(test.title || 'Examination Question Paper', {
      x: 50,
      y,
      size: 16,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    })
    y -= 25

    // Metadata Banner
    page.drawText(`Duration: ${test.totalDuration || 60} mins  |  Total Marks: ${test.totalMarks || 100}  |  Negative Marking: ${test.negativeMarks || 0}`, {
      x: 50,
      y,
      size: 10,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    })
    y -= 20

    page.drawLine({
      start: { x: 50, y },
      end: { x: 545, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    })
    y -= 30

    // Render questions
    const testQuestions = test.questions || []
    if (testQuestions.length === 0) {
      page.drawText('No questions found in this test.', {
        x: 50,
        y,
        size: 12,
        font: fontRegular,
        color: rgb(0.4, 0.4, 0.4),
      })
    } else {
      for (let i = 0; i < testQuestions.length; i++) {
        if (y < 150) {
          page = pdfDoc.addPage([595.28, 841.89])
          y = 800
        }

        const q = testQuestions[i].question
        if (!q) continue
        
        const qText = `Q${i + 1}. ${sanitizeText(q.content || q.title || 'Question text')}`

        page.drawText(qText, {
          x: 50,
          y,
          size: 11,
          font: fontBold,
          color: rgb(0.1, 0.1, 0.1),
        })
        y -= 20

        const options = [q.option1, q.option2, q.option3, q.option4, q.option5].filter(Boolean) as string[]
        const optLabels = ['(A)', '(B)', '(C)', '(D)', '(E)']
        for (let j = 0; j < options.length; j++) {
          if (y < 80) {
            page = pdfDoc.addPage([595.28, 841.89])
            y = 800
          }
          const optText = `${optLabels[j] || `(${j + 1})`} ${sanitizeText(options[j])}`
          
          let isCorrect = false
          if (withSolution && q.correctOption && q.correctOption === `option${j+1}`) {
            isCorrect = true
          }
          
          page.drawText(optText.substring(0, 100), {
            x: 65,
            y,
            size: 10,
            font: isCorrect ? fontBold : fontRegular,
            color: isCorrect ? rgb(0.1, 0.6, 0.1) : rgb(0.2, 0.2, 0.2),
          })
          y -= 18
        }
        
        if (withSolution && q.solution) {
          if (y < 80) {
            page = pdfDoc.addPage([595.28, 841.89])
            y = 800
          }
          y -= 5
          page.drawText(`Solution: ${sanitizeText(q.solution)}`, {
            x: 65,
            y,
            size: 10,
            font: fontRegular,
            color: rgb(0.1, 0.4, 0.8),
          })
          y -= 18
        }
        
        y -= 15
      }
    }

    const pdfBytes = await pdfDoc.save()
    const sanitizedTitle = (test.title || 'Test').replace(/[^a-zA-Z0-9_-]/g, '_')
    const filename = `${sanitizedTitle}${withSolution ? '_With_Solutions' : ''}.pdf`

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Error exporting test PDF:', error)
    return NextResponse.json({ success: false, error: 'Failed to generate PDF' }, { status: 500 })
  }
}
