export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrTeacher } from '@/lib/auth-helpers'
import { db as prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminOrTeacher(request)
    if (authResult.error) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status })
    }
    const auth = authResult.user
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    if (!id) {
      return NextResponse.json({ success: false, error: 'Exam ID is required' }, { status: 400 })
    }

    const exam = await prisma.examProfile.findFirst({
      where: { id, organizationId: auth.orgId || '' },
      include: {
        rules: true,
        theme: true,
        _count: {
          select: { tests: true }
        }
      }
    })

    if (!exam) {
      return NextResponse.json({ success: false, error: 'Exam profile not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, exam })
  } catch (error) {
    console.error('Error fetching exam profile:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch exam profile' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminOrTeacher(request)
    if (authResult.error) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status })
    }
    const auth = authResult.user
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    if (!id) {
      return NextResponse.json({ success: false, error: 'Exam ID is required' }, { status: 400 })
    }

    // Verify ownership
    const existing = await prisma.examProfile.findFirst({
      where: { id, organizationId: auth.orgId || '' }
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Exam profile not found' }, { status: 404 })
    }

    const data = await request.json()
    const { name, code, category, logo, description, language, defaultTestMode, instructions } = data

    const exam = await prisma.examProfile.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        code: code !== undefined ? code : undefined,
        category: category !== undefined ? category : undefined,
        logo: logo !== undefined ? logo : undefined,
        description: description !== undefined ? description : undefined,
        language: language !== undefined ? language : undefined,
        defaultTestMode: defaultTestMode !== undefined ? defaultTestMode : undefined,
        instructions: instructions !== undefined ? instructions : undefined,
      },
      include: { rules: true, theme: true }
    })

    return NextResponse.json({ success: true, exam })
  } catch (error) {
    console.error('Error updating exam profile:', error)
    return NextResponse.json({ success: false, error: 'Failed to update exam profile' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminOrTeacher(request)
    if (authResult.error) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status })
    }
    const auth = authResult.user
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    if (!id) {
      return NextResponse.json({ success: false, error: 'Exam ID is required' }, { status: 400 })
    }

    const existing = await prisma.examProfile.findFirst({
      where: { id, organizationId: auth.orgId || '' }
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Exam profile not found' }, { status: 404 })
    }

    await prisma.examProfile.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting exam profile:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete exam profile' }, { status: 500 })
  }
}

