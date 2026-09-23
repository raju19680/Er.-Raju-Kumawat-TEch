import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orgCode = searchParams.get('orgCode')

    if (!orgCode) {
      return NextResponse.json(
        { success: false, message: 'Organization code is required' },
        { status: 400 }
      )
    }

    // Find the organization
    const org = await db.organization.findUnique({
      where: { code: orgCode },
      select: {
        razorpayKeyId: true,
        gatewayCharge: true,
        adminCommission: true,
      },
    })

    if (!org) {
      return NextResponse.json(
        { success: false, message: 'Invalid organization code' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      config: {
        key: org.razorpayKeyId || 'rzp_test_demo_key',
        gatewayCharge: org.gatewayCharge,
        adminCommission: org.adminCommission,
      },
    })
  } catch (error) {
    console.error('Payment config error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
