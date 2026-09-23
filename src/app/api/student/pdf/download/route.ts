import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const url = searchParams.get('url')
    if (!url) {
      return NextResponse.json({ success: false, error: 'PDF URL is required' }, { status: 400 })
    }

    // Fetch student to get verified mobile number
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

    // Load original PDF
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch original PDF: ' + response.statusText)
    }
    const arrayBuffer = await response.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)

    // Embed security watermark diagonally on every page
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const pages = pdfDoc.getPages()
    const watermarkText = studentPhone || studentName

    for (const page of pages) {
      const { width, height } = page.getSize()
      const textWidth = font.widthOfTextAtSize(watermarkText, 48)
      page.drawText(watermarkText, {
        x: width / 2 - textWidth / 2,
        y: height / 2,
        size: 48,
        font,
        color: rgb(0.8, 0.8, 0.8),
        opacity: 0.15,
        rotate: degrees(-45),
      })
    }

    // NOTE: pdf-lib does not support password encryption (AES) out-of-the-box in v1.17.
    // The watermark serves as the primary theft deterrent for now.
    const pdfBytes = await pdfDoc.save()

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Course_Material.pdf"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    console.error('Error downloading Course PDF:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to generate PDF' }, { status: 500 })
  }
}
