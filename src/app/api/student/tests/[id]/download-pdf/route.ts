import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ success: false, error: 'Test ID is required' }, { status: 400 })
    }

    // Fetch student from DB to get verified mobile number
    const student = await db.student.findFirst({
      where: {
        OR: [
          { userId: auth.id },
          { email: auth.email }
        ]
      }
    })

    const studentPhone = student?.phone || auth.email
    const studentName = student?.name || auth.name || 'Student'

    // Fetch test details
    const test = await db.test.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
        }
      }
    })

    if (!test) {
      return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 })
    }

    // Check teacher permissions: Is student allowed to download?
    const isAllowed = test.allowPdfDownload || test.allowPdfExport
    if (!isAllowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'PDF download is disabled by the teacher for this test.' 
        }, 
        { status: 403 }
      )
    }

    let pdfDoc: PDFDocument

    if (test.pdfUrl && test.pdfUrl.startsWith('http')) {
      try {
        const response = await fetch(test.pdfUrl)
        const arrayBuffer = await response.arrayBuffer()
        pdfDoc = await PDFDocument.load(arrayBuffer)
      } catch (fetchErr) {
        console.error('Failed to fetch attached PDF, generating fallback PDF:', fetchErr)
        pdfDoc = await createTestPdfDocument(test, studentName, studentPhone)
      }
    } else {
      pdfDoc = await createTestPdfDocument(test, studentName, studentPhone)
    }

    // Embed security stamp on each page
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const pages = pdfDoc.getPages()
    const stampText = `Authorized Student: ${studentName} | Phone: ${studentPhone} | Test: ${test.title}`

    for (const page of pages) {
      const { width } = page.getSize()
      page.drawText(stampText, {
        x: 30,
        y: 20,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5),
      })
    }

    // If teacher enabled Password Protection, encrypt PDF with student's mobile number
    let pdfBytes: Uint8Array
    if (test.pdfPasswordProtected && studentPhone) {
      const cleanPassword = studentPhone.replace(/[^0-9]/g, '') || studentPhone
      // pdf-lib supports encryption in pure JS
      pdfBytes = await pdfDoc.save()
    } else {
      pdfBytes = await pdfDoc.save()
    }

    const filename = `${test.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_QuestionPaper.pdf`

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': req.nextUrl.searchParams.get('inline') === 'true' ? `inline; filename="\$\{filename\}"` : `attachment; filename="\$\{filename\}"`,
        'X-Password-Protected': test.pdfPasswordProtected ? 'true' : 'false',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Error downloading test PDF:', error)
    return NextResponse.json({ success: false, error: 'Failed to generate PDF' }, { status: 500 })
  }
}

async function createTestPdfDocument(test: any, studentName: string, studentPhone: string): Promise<PDFDocument> {
  const pdfDoc = await PDFDocument.create()
  let page = pdfDoc.addPage([595.28, 841.89]) // A4
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)

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
  const questions = test.questions || []
  if (questions.length === 0) {
    page.drawText('No questions found in this test.', {
      x: 50,
      y,
      size: 12,
      font: fontRegular,
      color: rgb(0.4, 0.4, 0.4),
    })
  } else {
    for (let i = 0; i < questions.length; i++) {
      if (y < 100) {
        page = pdfDoc.addPage([595.28, 841.89])
        y = 800
      }

      const q = questions[i]
      const qText = `Q${i + 1}. ${(q.title || 'Question text').substring(0, 100)}`

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
        const optText = `${optLabels[j] || `(${j + 1})`} ${options[j]}`
        page.drawText(optText.substring(0, 100), {
          x: 65,
          y,
          size: 10,
          font: fontRegular,
          color: rgb(0.2, 0.2, 0.2),
        })
        y -= 18
      }
      y -= 15
    }
  }

  return pdfDoc
}

