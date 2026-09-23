import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeInput } from '@/lib/auth-security'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    // ── Rate limiting (prevent org enumeration) ──
    const clientIp = getClientIp(req.headers)
    const rateLimitResult = checkRateLimit(`verify-org:${clientIp}`)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const rawOrgCode = body.orgCode

    if (!rawOrgCode || typeof rawOrgCode !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const orgCode = sanitizeInput(rawOrgCode)

    // Try to find organization by code first, then by id
    let org = await db.organization.findUnique({
      where: { code: orgCode },
      select: {
        id: true,
        name: true,
        code: true,
        logo: true,
        accentColor: true,
      },
    })

    if (!org) {
      // Try by ID (cuid)
      org = await db.organization.findUnique({
        where: { id: orgCode },
        select: {
          id: true,
          name: true,
          code: true,
          logo: true,
          accentColor: true,
        },
      })
    }

    if (!org) {
      return NextResponse.json(
        { success: false, message: 'Invalid Organization ID. Please check and try again.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      organization: org,
    })
  } catch (error: any) {
    console.error('Verify org error:', error)
    return NextResponse.json(
      { success: false, message: 'Something went wrong: ' + (error?.message || String(error)) },
      { status: 500 }
    )
  }
}
