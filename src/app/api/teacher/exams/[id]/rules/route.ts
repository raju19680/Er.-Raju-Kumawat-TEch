export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifyAuth(req)
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const rules = await (prisma as any).examRule?.findFirst({
      where: {
        examProfileId: id,
        ...(session.organizationId ? { organizationId: session.organizationId } : {}),
      },
    })

    return NextResponse.json({ success: true, rules })
  } catch (error) {
    console.error('Error fetching exam rules:', error)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifyAuth(req)
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    
    const orgId = session.organizationId || 'default'

    // Check if rules exist
    const existingRules = await (prisma as any).examRule?.findFirst({
      where: {
        examProfileId: id,
        organizationId: orgId,
      }
    })

    let rules;
    if (existingRules) {
      rules = await (prisma as any).examRule?.update({
        where: { id: existingRules.id },
        data: {
          navSections: body.navSections ?? existingRules.navSections,
          navQuestions: body.navQuestions ?? existingRules.navQuestions,
          maxAttempts: body.maxAttempts ?? existingRules.maxAttempts,
          marksPerQ: body.marksPerQ ?? existingRules.marksPerQ,
          negMarking: body.negMarking ?? existingRules.negMarking,
          negMarks: body.negMarks ?? existingRules.negMarks,
        }
      })
    } else {
      rules = await (prisma as any).examRule?.create({
        data: {
          examProfileId: id,
          organizationId: orgId,
          navSections: body.navSections ?? true,
          navQuestions: body.navQuestions ?? true,
          maxAttempts: body.maxAttempts ?? 1,
          marksPerQ: body.marksPerQ ?? 1,
          negMarking: body.negMarking ?? false,
          negMarks: body.negMarks ?? 0,
        }
      })
    }

    return NextResponse.json({ success: true, rules })
  } catch (error) {
    console.error('Error updating exam rules:', error)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}

