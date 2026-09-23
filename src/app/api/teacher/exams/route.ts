export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrTeacher } from '@/lib/auth-helpers'
import { db as prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminOrTeacher(request)
    if (authResult.error) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status })
    }
    const auth = authResult.user
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const exams = await prisma.examProfile.findMany({
      where: { organizationId: auth.orgId || '' },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { tests: true }
        }
      }
    })

    return NextResponse.json({ success: true, exams })
  } catch (error) {
    console.error('Error fetching exam profiles:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch exam profiles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminOrTeacher(request)
    if (authResult.error) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status })
    }
    const auth = authResult.user
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await request.json()
    const { name, code, category, logo, description, language, defaultTestMode, instructions } = data

    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
    }

    // Create the ExamProfile along with a default ExamRule and ExamTheme
    const exam = await prisma.examProfile.create({
      data: {
        name,
        code,
        category,
        logo,
        description,
        language: language || 'english',
        defaultTestMode: defaultTestMode || 'CBT',
        instructions,
        organizationId: auth.orgId || '',
        rules: {
          create: {
            organizationId: auth.orgId || ''
          }
        },
      }
    })

    return NextResponse.json({ success: true, exam })
  } catch (error) {
    console.error('Error creating exam profile:', error)
    return NextResponse.json({ success: false, error: 'Failed to create exam profile' }, { status: 500 })
  }
}

