import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import * as fs from 'fs'
import * as path from 'path'

// GET - List student's certificates
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

    const studentId = auth.id
    const certificates = await db.certificate.findMany({
      where: { studentId },
      include: { course: { select: { title: true } } }
    })
    
    return NextResponse.json({ success: true, certificates })
  } catch (error) {
    console.error('Error fetching certificates:', error)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}

// POST - Generate certificate for completed course
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

    const { courseId } = await req.json()
    if (!courseId) return NextResponse.json({ success: false, message: 'Missing courseId' }, { status: 400 })

    const studentId = auth.id

    // Check if course is actually completed
    const purchasedCourse = await db.purchasedCourse.findFirst({
      where: { studentId, courseId },
      include: { course: { include: { modules: { include: { lessons: true } } } } }
    })

    if (!purchasedCourse) {
      return NextResponse.json({ success: false, message: 'Course not purchased' }, { status: 403 })
    }

    const allLessons = purchasedCourse.course.modules.flatMap(m => m.lessons)
    const progress = await db.lessonProgress.findMany({
      where: { studentId, courseId }
    })

    const completedCount = allLessons.filter(l => progress.some(p => p.lessonId === l.id && p.status === 'completed')).length
    const totalLessons = allLessons.length
    
    if (totalLessons === 0 || completedCount < totalLessons) {
      return NextResponse.json({ success: false, message: 'Course not fully completed' }, { status: 400 })
    }

    // Check if certificate already exists
    let certificate = await db.certificate.findFirst({
      where: { studentId, courseId }
    })

    if (certificate) {
      return NextResponse.json({ success: true, certificateUrl: certificate.certificateUrl })
    }

    // Generate new PDF certificate
    const student = await db.student.findUnique({ where: { id: studentId } })
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([842, 595]) // A4 Landscape
    
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
    
    page.drawText('CERTIFICATE OF COMPLETION', { x: 180, y: 450, size: 30, font, color: rgb(0.2, 0.2, 0.5) })
    page.drawText('This certifies that', { x: 350, y: 380, size: 16, font: fontRegular })
    page.drawText(student?.name || 'Student', { x: 300, y: 330, size: 24, font, color: rgb(0.1, 0.1, 0.1) })
    page.drawText('has successfully completed the course', { x: 280, y: 280, size: 16, font: fontRegular })
    page.drawText(purchasedCourse.course.title, { x: 200, y: 230, size: 24, font, color: rgb(0.7, 0.4, 0.1) })
    
    const dateStr = new Date().toLocaleDateString()
    page.drawText(`Date: ${dateStr}`, { x: 150, y: 120, size: 14, font: fontRegular })
    page.drawText('Authorized Signature', { x: 550, y: 120, size: 14, font: fontRegular })
    
    page.drawLine({ start: { x: 530, y: 140 }, end: { x: 700, y: 140 }, thickness: 1 })

    const pdfBytes = await pdfDoc.save()
    
    // Save to disk
    const fileName = `cert_${studentId}_${courseId}.pdf`
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'certificates', fileName)
    fs.writeFileSync(filePath, pdfBytes)
    
    const certificateUrl = `/uploads/certificates/${fileName}`

    // Create DB entry
    certificate = await db.certificate.create({
      data: {
        studentId,
        courseId,
        organizationId: purchasedCourse.course.organizationId,
        certificateUrl
      }
    })

    return NextResponse.json({ success: true, certificateUrl })
  } catch (error) {
    console.error('Error generating certificate:', error)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}
