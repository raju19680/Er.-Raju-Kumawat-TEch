import { NextResponse, NextRequest } from 'next/server'
import { PDFDocument } from 'pdf-lib-plus-encrypt'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const { auth, student, error, status } = await getAuthStudent(req)
    if (error || !student || !auth) {
      return new NextResponse(error || 'Unauthorized', { status: status || 401 })
    }

    const { searchParams } = new URL(req.url)
    const fileUrl = searchParams.get('url')

    if (!fileUrl) {
      return new NextResponse('Missing url parameter', { status: 400 })
    }

    if (!student.phone) {
      return new NextResponse('Student phone number not found. Cannot encrypt.', { status: 400 })
    }

    // Clean the phone number to be just digits (or whatever format we want as password)
    const phonePassword = student.phone.replace(/[^0-9]/g, '') || '123456' // Fallback for admin-bypass where phone might be email

    // Fetch the raw PDF from the provided URL (this could be a Supabase storage URL)
    // We assume the URL is publicly readable or accessible by the server
    const pdfResponse = await fetch(fileUrl)
    
    if (!pdfResponse.ok) {
      return new NextResponse('Failed to fetch the original PDF file', { status: pdfResponse.status })
    }

    const pdfBuffer = await pdfResponse.arrayBuffer()

    // Load and encrypt the PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true })
    
    await pdfDoc.encrypt({
      userPassword: phonePassword,
      ownerPassword: phonePassword + 'admin', // Owner password to prevent removing restrictions
      permissions: {
        modifying: false,
        copying: false,
        annotating: false,
        printing: false
      }
    })

    const encryptedPdfBytes = await pdfDoc.save()

    // Send the encrypted PDF back to the client
    return new NextResponse(Buffer.from(encryptedPdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="secure_document.pdf"',
      }
    })
  } catch (error) {
    console.error('[PDF_DOWNLOAD_ERROR]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
