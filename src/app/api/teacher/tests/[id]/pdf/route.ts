export const dynamic = 'force-dynamic'
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

    // Questions are directly on Test (Question[] via testId), not a join table
    const test = await db.test.findFirst({
      where: {
        id,
        organizationId: auth.orgId || ''
      },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!test) {
      return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 })
    }

    const pdfDoc = await PDFDocument.create()
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)

    // Strip HTML tags and decode entities
    const sanitizeText = (html: string | null | undefined): string => {
      if (!html) return ''
      return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim()
    }

    // Word wrap long text into lines that fit within maxWidth
    const wrapText = (text: string, font: any, fontSize: number, maxWidth: number): string[] => {
      const lines: string[] = []
      const paragraphs = text.split('\n')
      for (const para of paragraphs) {
        const words = para.split(' ')
        let currentLine = ''
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word
          const width = font.widthOfTextAtSize(testLine, fontSize)
          if (width > maxWidth && currentLine) {
            lines.push(currentLine)
            currentLine = word
          } else {
            currentLine = testLine
          }
        }
        if (currentLine) lines.push(currentLine)
      }
      return lines.length > 0 ? lines : ['']
    }

    const PAGE_WIDTH = 595.28
    const PAGE_HEIGHT = 841.89
    const MARGIN_LEFT = 50
    const MARGIN_RIGHT = 50
    const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT
    const MARGIN_BOTTOM = 60

    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    let y = PAGE_HEIGHT - 50

    // Helper to check if we need a new page
    const ensureSpace = (needed: number) => {
      if (y - needed < MARGIN_BOTTOM) {
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
        y = PAGE_HEIGHT - 50
      }
    }

    // ─── Title Header ───
    page.drawText(test.title || 'Examination Question Paper', {
      x: MARGIN_LEFT,
      y,
      size: 18,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.4),
    })
    y -= 28

    // ─── Metadata Banner ───
    const metaText = `Duration: ${test.totalDuration || 60} mins  |  Total Marks: ${test.totalMarks || 100}  |  Questions: ${test.questions?.length || 0}  |  Negative Marking: ${test.negativeMarks || 0}`
    page.drawText(metaText, {
      x: MARGIN_LEFT,
      y,
      size: 9,
      font: fontRegular,
      color: rgb(0.4, 0.4, 0.4),
    })
    y -= 15

    // Divider line
    page.drawLine({
      start: { x: MARGIN_LEFT, y },
      end: { x: PAGE_WIDTH - MARGIN_RIGHT, y },
      thickness: 1.5,
      color: rgb(0.2, 0.2, 0.6),
    })
    y -= 25

    // Mode label
    const modeLabel = withSolution ? '(With Solutions)' : '(Without Solutions)'
    page.drawText(modeLabel, {
      x: MARGIN_LEFT,
      y,
      size: 10,
      font: fontBold,
      color: withSolution ? rgb(0.0, 0.5, 0.0) : rgb(0.5, 0.0, 0.0),
    })
    y -= 25

    // ─── Render Questions ───
    const questions = test.questions || []

    if (questions.length === 0) {
      page.drawText('No questions found in this test.', {
        x: MARGIN_LEFT,
        y,
        size: 12,
        font: fontRegular,
        color: rgb(0.5, 0.5, 0.5),
      })
    } else {
      const optLabels = ['(A)', '(B)', '(C)', '(D)', '(E)']

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]

        // Question text
        const qClean = sanitizeText(q.title || q.heading || '')
        const qPrefix = `Q${i + 1}. `
        const qLines = wrapText(qPrefix + qClean, fontBold, 11, CONTENT_WIDTH)

        // Options
        const rawOptions = [q.option1, q.option2, q.option3, q.option4, q.option5].filter(Boolean) as string[]
        const optionLines: { lines: string[]; isCorrect: boolean }[] = rawOptions.map((opt, j) => {
          const optClean = sanitizeText(opt)
          const label = optLabels[j] || `(${j + 1})`
          const lines = wrapText(`${label} ${optClean}`, fontRegular, 10, CONTENT_WIDTH - 20)
          let isCorrect = false
          if (withSolution && q.correctOption) {
            if (q.correctOption === `option${j + 1}`) isCorrect = true
          }
          return { lines, isCorrect }
        })

        // Solution text (if with solution mode)
        let solutionLines: string[] = []
        if (withSolution) {
          const solText = sanitizeText(q.solutionText || '')
          if (solText) {
            solutionLines = wrapText(`Solution: ${solText}`, fontRegular, 9, CONTENT_WIDTH - 20)
          }
          // Show correct answer label
          if (q.correctOption) {
            const correctIdx = parseInt(q.correctOption.replace('option', '')) - 1
            if (correctIdx >= 0 && correctIdx < optLabels.length) {
              const correctLabel = `✓ Correct Answer: ${optLabels[correctIdx]}`
              solutionLines = [correctLabel, ...solutionLines]
            }
          }
        }

        // Calculate total space needed for this question
        const spaceNeeded =
          qLines.length * 16 +                                         // question lines
          optionLines.reduce((sum, o) => sum + o.lines.length * 15, 0) + // option lines
          (solutionLines.length > 0 ? solutionLines.length * 14 + 10 : 0) + // solution
          30                                                            // padding

        ensureSpace(Math.min(spaceNeeded, 300)) // cap at 300 to avoid infinite loop

        // Draw question number + text
        for (const line of qLines) {
          ensureSpace(20)
          page.drawText(line, {
            x: MARGIN_LEFT,
            y,
            size: 11,
            font: fontBold,
            color: rgb(0.1, 0.1, 0.1),
          })
          y -= 16
        }
        y -= 4

        // Draw options
        for (const optData of optionLines) {
          for (const line of optData.lines) {
            ensureSpace(18)
            page.drawText(line, {
              x: MARGIN_LEFT + 15,
              y,
              size: 10,
              font: optData.isCorrect ? fontBold : fontRegular,
              color: optData.isCorrect ? rgb(0.0, 0.55, 0.0) : rgb(0.2, 0.2, 0.2),
            })
            y -= 15
          }
        }

        // Draw solution (if applicable)
        if (solutionLines.length > 0) {
          y -= 5
          for (const line of solutionLines) {
            ensureSpace(16)
            page.drawText(line, {
              x: MARGIN_LEFT + 15,
              y,
              size: 9,
              font: fontRegular,
              color: rgb(0.0, 0.3, 0.7),
            })
            y -= 14
          }
        }

        // Spacing between questions
        y -= 18

        // Light separator line between questions
        if (i < questions.length - 1) {
          ensureSpace(10)
          page.drawLine({
            start: { x: MARGIN_LEFT, y: y + 8 },
            end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: y + 8 },
            thickness: 0.5,
            color: rgb(0.85, 0.85, 0.85),
          })
        }
      }
    }

    // ─── Footer on last page ───
    const pageCount = pdfDoc.getPageCount()
    for (let p = 0; p < pageCount; p++) {
      const pg = pdfDoc.getPage(p)
      pg.drawText(`Page ${p + 1} of ${pageCount}`, {
        x: PAGE_WIDTH - 120,
        y: 30,
        size: 8,
        font: fontRegular,
        color: rgb(0.6, 0.6, 0.6),
      })
    }

    const pdfBytes = await pdfDoc.save()
    const sanitizedTitle = (test.title || 'Test').replace(/[^a-zA-Z0-9_ -]/g, '_').substring(0, 50)
    const filename = `${sanitizedTitle}${withSolution ? '_With_Solutions' : '_Questions_Only'}.pdf`

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBytes.length),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error exporting test PDF:', error)
    return NextResponse.json({ success: false, error: 'Failed to generate PDF' }, { status: 500 })
  }
}
