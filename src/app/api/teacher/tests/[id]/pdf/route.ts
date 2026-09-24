export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdminOrTeacher } from '@/lib/auth-helpers'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import * as fs from 'fs'
import * as path from 'path'

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

    // Questions are directly on Test (Question[] via testId)
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
    pdfDoc.registerFontkit(fontkit)

    // Try to embed Noto Sans Devanagari (Static) for Hindi support
    let customFont: any = null
    let customFontBold: any = null
    try {
      const fontPath = path.join(process.cwd(), 'public', 'fonts', 'mangal.ttf')
      if (fs.existsSync(fontPath)) {
        const fontBytes = fs.readFileSync(fontPath)
        customFont = await pdfDoc.embedFont(fontBytes, { subset: true }) // Enable subsetting again for smaller file size
        customFontBold = customFont // Using regular for bold too since we only downloaded regular
      }
    } catch (e) {
      console.warn('Could not load custom font, falling back to Helvetica:', e)
    }

    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const helveticaRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)

    // Use custom font if available, else standard fonts
    const fontBold = customFont || helveticaBold
    const fontRegular = customFont || helveticaRegular

    // Check if text has non-ASCII (Hindi/Devanagari)
    const hasNonAscii = (text: string) => /[^\x00-\x7F]/.test(text)

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
        .replace(/[\u2018\u2019]/g, "'") // Smart single quotes
        .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
        .replace(/[\u2013\u2014]/g, '-') // En and em dashes
        .replace(/\u2026/g, '...') // Ellipsis
        .replace(/\u2022/g, '-') // Bullet
        .replace(/\u00A0/g, ' ') // Non-breaking space
        .replace(/\s+/g, ' ')
        .trim()
    }

    // Safe width measurement that handles encoding errors
    const safeTextWidth = (text: string, font: any, fontSize: number): number => {
      try {
        return font.widthOfTextAtSize(text, fontSize)
      } catch {
        // Fallback: estimate width based on character count
        return text.length * fontSize * 0.5
      }
    }

    // Choose the right font for the text content
    const getFontForText = (text: string, bold: boolean) => {
      if (hasNonAscii(text)) {
        return customFont || (bold ? helveticaBold : helveticaRegular)
      }
      return bold ? fontBold : fontRegular
    }

    // Safe drawText that handles encoding errors gracefully word-by-word
    const safeDrawText = (page: any, text: string, options: any) => {
      try {
        page.drawText(text, options)
      } catch (e) {
        // If the whole string fails, try word by word to isolate the crash
        const words = text.split(' ')
        let currentX = options.x || 0
        const fontSize = options.size || 12
        const fallbackFont = options.font === fontBold ? helveticaBold : helveticaRegular

        for (const word of words) {
          try {
            page.drawText(word, { ...options, x: currentX })
            currentX += safeTextWidth(word + ' ', options.font, fontSize)
          } catch (e2) {
            // Only replace the crashed word with ?
            const asciiOnly = word.replace(/[^\x20-\x7E]/g, '?')
            page.drawText(asciiOnly, { ...options, font: fallbackFont, x: currentX })
            currentX += fallbackFont.widthOfTextAtSize(asciiOnly + ' ', fontSize)
          }
        }
      }
    }

    // Word wrap with safe width measurement
    const wrapText = (text: string, font: any, fontSize: number, maxWidth: number): string[] => {
      const lines: string[] = []
      const paragraphs = text.split('\n')
      for (const para of paragraphs) {
        if (!para.trim()) {
          lines.push('')
          continue
        }
        const words = para.split(' ')
        let currentLine = ''
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word
          const width = safeTextWidth(testLine, font, fontSize)
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

    const ensureSpace = (needed: number) => {
      if (y - needed < MARGIN_BOTTOM) {
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
        y = PAGE_HEIGHT - 50
      }
    }

    // ─── Title Header ───
    const titleFont = getFontForText(test.title || '', true)
    safeDrawText(page, test.title || 'Examination Question Paper', {
      x: MARGIN_LEFT,
      y,
      size: 18,
      font: titleFont,
      color: rgb(0.1, 0.1, 0.4),
    })
    y -= 28

    // ─── Metadata Banner ───
    const metaText = `Duration: ${test.totalDuration || 60} mins  |  Total Marks: ${test.totalMarks || 100}  |  Questions: ${test.questions?.length || 0}  |  Negative Marking: ${test.negativeMarks || 0}`
    safeDrawText(page, metaText, {
      x: MARGIN_LEFT,
      y,
      size: 9,
      font: helveticaRegular,
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
    safeDrawText(page, modeLabel, {
      x: MARGIN_LEFT,
      y,
      size: 10,
      font: helveticaBold,
      color: withSolution ? rgb(0.0, 0.5, 0.0) : rgb(0.5, 0.0, 0.0),
    })
    y -= 25

    // ─── Render Questions ───
    const questions = test.questions || []

    if (questions.length === 0) {
      safeDrawText(page, 'No questions found in this test.', {
        x: MARGIN_LEFT,
        y,
        size: 12,
        font: helveticaRegular,
        color: rgb(0.5, 0.5, 0.5),
      })
    } else {
      const optLabels = ['(A)', '(B)', '(C)', '(D)', '(E)']

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]

        // Question text
        const qClean = sanitizeText(q.title || q.heading || '')
        const qPrefix = `Q${i + 1}. `
        const qFullText = qPrefix + qClean
        const qFont = getFontForText(qFullText, true)
        const qLines = wrapText(qFullText, qFont, 11, CONTENT_WIDTH)

        // Options
        const rawOptions = [q.option1, q.option2, q.option3, q.option4, q.option5].filter(Boolean) as string[]
        const optionData: { lines: string[]; isCorrect: boolean; font: any }[] = rawOptions.map((opt, j) => {
          const optClean = sanitizeText(opt)
          const label = optLabels[j] || `(${j + 1})`
          const fullOptText = `${label} ${optClean}`
          const optFont = getFontForText(fullOptText, false)
          const lines = wrapText(fullOptText, optFont, 10, CONTENT_WIDTH - 20)
          let isCorrect = false
          if (withSolution && q.correctOption) {
            if (q.correctOption === `option${j + 1}`) isCorrect = true
          }
          return { lines, isCorrect, font: optFont }
        })

        // Solution
        let solutionLines: string[] = []
        let solFont = helveticaRegular
        if (withSolution) {
          const solText = sanitizeText(q.solutionText || '')
          if (solText) {
            solFont = getFontForText(solText, false)
            solutionLines = wrapText(`Solution: ${solText}`, solFont, 9, CONTENT_WIDTH - 20)
          }
          if (q.correctOption) {
            const correctIdx = parseInt(q.correctOption.replace('option', '')) - 1
            if (correctIdx >= 0 && correctIdx < optLabels.length) {
              solutionLines = [`Correct Answer: ${optLabels[correctIdx]}`, ...solutionLines]
            }
          }
        }

        // Calculate space needed
        const spaceNeeded =
          qLines.length * 16 +
          optionData.reduce((sum, o) => sum + o.lines.length * 15, 0) +
          (solutionLines.length > 0 ? solutionLines.length * 14 + 10 : 0) +
          30

        ensureSpace(Math.min(spaceNeeded, 300))

        // Draw question
        for (const line of qLines) {
          ensureSpace(20)
          safeDrawText(page, line, {
            x: MARGIN_LEFT,
            y,
            size: 11,
            font: qFont,
            color: rgb(0.1, 0.1, 0.1),
          })
          y -= 16
        }
        y -= 4

        // Draw options
        for (const optInfo of optionData) {
          for (const line of optInfo.lines) {
            ensureSpace(18)
            safeDrawText(page, line, {
              x: MARGIN_LEFT + 15,
              y,
              size: 10,
              font: optInfo.isCorrect ? (customFont || helveticaBold) : optInfo.font,
              color: optInfo.isCorrect ? rgb(0.0, 0.55, 0.0) : rgb(0.2, 0.2, 0.2),
            })
            y -= 15
          }
        }

        // Draw solution
        if (solutionLines.length > 0) {
          y -= 5
          for (const line of solutionLines) {
            ensureSpace(16)
            safeDrawText(page, line, {
              x: MARGIN_LEFT + 15,
              y,
              size: 9,
              font: solFont,
              color: rgb(0.0, 0.3, 0.7),
            })
            y -= 14
          }
        }

        y -= 18

        // Separator line
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

    // ─── Page numbers ───
    const pageCount = pdfDoc.getPageCount()
    for (let p = 0; p < pageCount; p++) {
      const pg = pdfDoc.getPage(p)
      pg.drawText(`Page ${p + 1} of ${pageCount}`, {
        x: PAGE_WIDTH - 120,
        y: 30,
        size: 8,
        font: helveticaRegular,
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
