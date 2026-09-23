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
    const examProfile = await (prisma as any).examProfile?.findUnique({
      where: {
        id: id,
        ...(session.organizationId ? { organizationId: session.organizationId } : {}),
      },
      include: {
        theme: true
      }
    })

    if (!examProfile) {
      return NextResponse.json({ success: false, message: 'Exam Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, theme: examProfile.theme })
  } catch (error) {
    console.error('Error fetching exam theme:', error)
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
    
    const examProfile = await (prisma as any).examProfile?.findUnique({
      where: {
        id: id,
        organizationId: orgId,
      }
    })

    if (!examProfile) {
      return NextResponse.json({ success: false, message: 'Exam Profile not found' }, { status: 404 })
    }

    let theme;
    if (examProfile.defaultThemeId) {
      theme = await (prisma as any).examTheme?.update({
        where: { id: examProfile.defaultThemeId },
        data: {
          primaryColor: body.primaryColor,
          secondaryColor: body.secondaryColor,
          backgroundColor: body.backgroundColor,
          headerColor: body.headerColor,
          footerColor: body.footerColor,
          fontFamily: body.fontFamily,
          logo: body.logoUrl || body.logo,
          watermark: body.watermarkText || body.watermark,
        }
      })
    } else {
      theme = await (prisma as any).examTheme?.create({
        data: {
          name: `${examProfile.name} Theme`,
          organizationId: orgId,
          primaryColor: body.primaryColor,
          secondaryColor: body.secondaryColor,
          backgroundColor: body.backgroundColor,
          headerColor: body.headerColor,
          footerColor: body.footerColor,
          fontFamily: body.fontFamily,
          logo: body.logoUrl || body.logo,
          watermark: body.watermarkText || body.watermark,
        }
      })
      
      await (prisma as any).examProfile?.update({
        where: { id: examProfile.id },
        data: { defaultThemeId: theme.id }
      })
    }

    return NextResponse.json({ success: true, theme })
  } catch (error) {
    console.error('Error updating exam theme:', error)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}

