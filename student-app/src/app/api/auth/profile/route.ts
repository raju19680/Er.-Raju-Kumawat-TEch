import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's profile
    const user = await db.user.findUnique({
      where: { id: auth.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        organizationId: true,
        twoFactorEnabled: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get organization info
    let organization: {
      id: string
      name: string
      code: string
      logo: string | null
      accentColor: string
      phone: string | null
      status: string
      adminCommission: number
      gatewayCharge: number
      razorpayKeyId: string | null
      razorpayAccountId: string | null
    } | null = null
    if (user.organizationId) {
      organization = await db.organization.findUnique({
        where: { id: user.organizationId },
        select: {
          id: true,
          name: true,
          code: true,
          logo: true,
          accentColor: true,
          phone: true,
          status: true,
          adminCommission: true,
          gatewayCharge: true,
          razorpayKeyId: true,
          razorpayAccountId: true,
          // Never return razorpayKeySecret for security
        },
      })
    }

    return NextResponse.json({ success: true, user, organization })
  } catch (error) {
    console.error('Failed to fetch profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Update user profile
    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.avatar !== undefined) updateData.avatar = body.avatar

    if (Object.keys(updateData).length > 0) {
      await db.user.update({
        where: { id: auth.id },
        data: updateData,
      })
    }

    // Update organization if user has one and org fields are provided
    if (auth.orgId && (body.orgName !== undefined || body.orgPhone !== undefined || body.orgAccentColor !== undefined || body.orgLogo !== undefined)) {
      const orgUpdateData: Record<string, unknown> = {}
      if (body.orgName !== undefined) orgUpdateData.name = body.orgName
      if (body.orgPhone !== undefined) orgUpdateData.phone = body.orgPhone
      if (body.orgAccentColor !== undefined) orgUpdateData.accentColor = body.orgAccentColor
      if (body.orgLogo !== undefined) orgUpdateData.logo = body.orgLogo

      if (Object.keys(orgUpdateData).length > 0) {
        await db.organization.update({
          where: { id: auth.orgId },
          data: orgUpdateData,
        })
      }
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' })
  } catch (error) {
    console.error('Failed to update profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
