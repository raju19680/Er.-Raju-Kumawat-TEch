import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

/**
 * GET /api/organization/settings
 * Returns organization settings for the current teacher's org
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth || !auth.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const org = await db.organization.findUnique({
      where: { id: auth.orgId },
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

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, organization: org })
  } catch (error) {
    console.error('Failed to fetch organization settings:', error)
    return NextResponse.json({ error: 'Failed to fetch organization settings' }, { status: 500 })
  }
}

/**
 * PUT /api/organization/settings
 * Update organization settings (teachers can update their own org)
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth || !auth.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.logo !== undefined) updateData.logo = body.logo
    if (body.accentColor !== undefined) updateData.accentColor = body.accentColor

    // Only allow Razorpay key updates if the user is a teacher (not student)
    if (auth.role === 'teacher' || auth.role === 'platform_admin') {
      if (body.razorpayKeyId !== undefined) updateData.razorpayKeyId = body.razorpayKeyId
      if (body.razorpayKeySecret !== undefined) updateData.razorpayKeySecret = body.razorpayKeySecret
      if (body.razorpayAccountId !== undefined) updateData.razorpayAccountId = body.razorpayAccountId
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    await db.organization.update({
      where: { id: auth.orgId },
      data: updateData,
    })

    return NextResponse.json({ success: true, message: 'Organization settings updated' })
  } catch (error) {
    console.error('Failed to update organization settings:', error)
    return NextResponse.json({ error: 'Failed to update organization settings' }, { status: 500 })
  }
}
