import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, hashPassword } from '@/lib/auth'

// GET - List students (teacher's own students + enrolled students)
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Students directly assigned to this teacher
    const directStudents = await db.user.findMany({
      where: { role: 'STUDENT', teacherId: session.id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: { where: { course: { teacherId: session.id } } },
            testAttempts: { where: { test: { testSeries: { teacherId: session.id } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Students enrolled in teacher's courses
    const enrolledStudents = await db.enrollment.findMany({
      where: { course: { teacherId: session.id } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            phone: true,
            avatar: true,
            createdAt: true,
          },
        },
        course: {
          select: { id: true, title: true },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    })

    return NextResponse.json({ directStudents, enrolledStudents })
  } catch (error) {
    console.error('Get students error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add a student to teacher's roster
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { email, username, password, name, phone } = body

    if (!email || !username || !password || !name) {
      return NextResponse.json(
        { error: 'Email, username, password, and name are required' },
        { status: 400 }
      )
    }

    const existing = await db.user.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, { username }],
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Email or username already in use' },
        { status: 409 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const student = await db.user.create({
      data: {
        email: email.toLowerCase(),
        username,
        password: hashedPassword,
        name,
        phone,
        role: 'STUDENT',
        teacherId: session.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ student }, { status: 201 })
  } catch (error) {
    console.error('Create student error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
