import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET - List student's certificates
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const certificates = await db.certificate.findMany({
      where: { userId: session.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            teacher: { select: { id: true, name: true, organisationId: true } },
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    })

    return NextResponse.json({ certificates })
  } catch (error) {
    console.error('Get certificates error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Generate certificate for completed course
export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { courseId } = body

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }

    // Check enrollment and completion
    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: session.id, courseId } },
      include: { course: { select: { title: true, teacher: { select: { name: true } } } } },
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
    }

    if (enrollment.progress < 100) {
      return NextResponse.json(
        { error: `Course not completed yet. Progress: ${enrollment.progress.toFixed(0)}%` },
        { status: 400 }
      )
    }

    // Check if certificate already exists
    const existing = await db.certificate.findUnique({
      where: { userId_courseId: { userId: session.id, courseId } },
    })

    if (existing) {
      return NextResponse.json({ certificate: existing })
    }

    // Generate unique certificate number
    const certNumber = `EDU-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    const certificate = await db.certificate.create({
      data: {
        userId: session.id,
        courseId,
        certificateNumber: certNumber,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            teacher: { select: { id: true, name: true, organisationId: true } },
          },
        },
      },
    })

    return NextResponse.json({ certificate }, { status: 201 })
  } catch (error) {
    console.error('Generate certificate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
